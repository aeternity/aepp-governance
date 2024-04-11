const redis = require("redis");
const delegationLogic = require('./delegation_logic');

if (!process.env.WEBSOCKET_URL) throw "WEBSOCKET_URL is not set";
if (!process.env.REDIS_URL) throw "REDIS_URL is not set";

const client = redis.createClient({url: process.env.REDIS_URL});
const WebSocketClient = require('websocket').client;
let AsyncLock = require('async-lock');
let lock = new AsyncLock();

const cache = {};
cache.wsconnection = null;

cache.shortCacheTime = process.env.SHORT_CACHE_TIME || 2 * 60;
cache.longCacheTime = process.env.LONG_CACHE_TIME || 8 * 60 * 60;
cache.keepHotInterval = process.env.KEEP_HOT_INTERVAL || 60 * 1000;
cache.networkKey = "";

cache.init = async (aeternity) => {
    await client.connect();
    cache.networkKey = await aeternity.networkId();
    console.log("networkKey", cache.networkKey);
    cache.startInvalidator(aeternity);
    cache.keepHot(aeternity);
};

const buildKey = (keys) => [cache.networkKey, ...keys].join(":");

cache.getOrSet = async (keys, asyncFetchData, expire = null) => {
    const key = buildKey(keys);
    const value = await client.get(key);
    if (value) return JSON.parse(value);

    const startLock = new Date().getTime();
    return lock.acquire(key, async () => {
        const lockedValue = await client.get(key);
        if (lockedValue) {
            console.log("\n   lock.acquire", key, new Date().getTime() - startLock, "ms");
            return JSON.parse(lockedValue);
        }

        const start = new Date().getTime();
        const data = await asyncFetchData();
        await cache.set(keys, data, expire);
        (new Date().getTime() - start > 50) ? console.log("\n   cache", key, new Date().getTime() - start, "ms") : process.stdout.write("'");

        return data;
    });
};

cache.set = async (keys, data, expire = null) => {
    const key = buildKey(keys);

    await client.set(key, JSON.stringify(data), expire ? {EX: expire} : {});
};

cache.delByPrefix = async (prefixes) => {
    const prefix = buildKey(prefixes);
    console.log("      cache keys", prefix + "*");
    const rows = await client.keys(prefix + "*");
    if (rows.length) console.log("      cache delByPrefix", rows);
    await Promise.all(rows.map(key => client.del(key)));
};

cache.del = async (keys) => {
    const key = buildKey(keys);
    await client.del(key);
};

const addPollInvalidationListeners = async (aeternity) => {
    const polls = await aeternity.polls();
    polls.forEach(([_, data]) => addPollInvalidationListener(data.poll));
};

const addPollInvalidationListener = (poll) => {
    if (cache.wsconnection) {
        cache.wsconnection.send(JSON.stringify({op: "Subscribe", payload: "Object", target: poll}));
    } else {
        setTimeout(() => addPollInvalidationListener(poll), 30000);
    }
};

cache.handleContractEvent = async (event) => {
    switch (event.topic) {
        case "AddPoll":
            await cache.delByPrefix(["polls"]);
            addPollInvalidationListener(event.poll);
            break;
        case "Delegation":
            await cache.delByPrefix(["pollOrdering"]);
            await cache.del(["delegations", undefined]);
            break;
        case "RevokeDelegation":
            await cache.delByPrefix(["pollOrdering"]);
            await cache.del(["delegations", undefined]);
            break;
        case "Vote":
            await cache.delByPrefix(["pollOverview", event.poll]);
            await cache.delByPrefix(["pollOrdering"]);
            await cache.del(["pollStateAndVotingAccounts", event.poll]);
            break;
        case "RevokeVote":
            await cache.delByPrefix(["pollOverview", event.poll]);
            await cache.delByPrefix(["pollOrdering"]);
            await cache.del(["pollStateAndVotingAccounts", event.poll]);
            break;
    }
};

cache.startInvalidator = (aeternity) => {
    const wsclient = new WebSocketClient();
    wsclient.connect(process.env.WEBSOCKET_URL);

    wsclient.on('connectFailed', console.error);
    wsclient.on('connect', connection => {
        void addPollInvalidationListeners(aeternity);

        cache.wsconnection = connection;
        cache.wsconnection.send(JSON.stringify({op: "Subscribe", payload: "KeyBlocks"}));
        cache.wsconnection.send(JSON.stringify({op: "Subscribe", payload: "Transactions"}));
        cache.wsconnection.send(JSON.stringify({
            op: "Subscribe",
            payload: "Object",
            target: aeternity.contractAddress
        }));
        cache.wsconnection.on('message', async message => {
            if (message.type === 'utf8' && message.utf8Data.includes("payload")) {
                const data = JSON.parse(message.utf8Data);
                if (data.subscription === "KeyBlocks") {
                    await cache.del(["height"]);
                }
                if (data.subscription === "Transactions") {
                    switch (data.payload.tx.type) {
                        // TODO consider invalidating cache for other transaction types that may change balance significantly
                        case "SpendTx":
                            await cache.del(["balanceAtHeight", undefined, data.payload.tx.sender_id]);
                            await cache.del(["balanceAtHeight", undefined, data.payload.tx.recipient_id]);
                            break;
                    }
                }
                if (data.subscription === "Object") {
                    const event = await aeternity.transactionEvent({hash: data.payload.hash});
                    if (event) void cache.handleContractEvent(event);
                }
            }
        });
    });
};

cache.keepHot = (aeternity) => {
    const discoverDelegationEvents = async () => {
        const height = await aeternity.height();
        await delegationLogic.findDelegationEvents(cache, aeternity, height, false);
    };

    const keepHotLogic = async () => {
        const start = new Date().getTime();
        await aeternity.init();
        await discoverDelegationEvents();
        await aeternity.tokenSupply();
        console.log("\n  cache keepHot", new Date().getTime() - start, "ms");
    };

    void keepHotLogic();
    setInterval(keepHotLogic, cache.keepHotInterval);
};

module.exports = cache;
