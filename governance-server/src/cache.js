const redis = require("redis");
const client = redis.createClient();
const {promisify} = require('util');
const get = promisify(client.get).bind(client);
const set = promisify(client.set).bind(client);
const del = promisify(client.del).bind(client);
const keys = promisify(client.keys).bind(client);
const WebSocketClient = require('websocket').client;

const cache = {};

cache.wsconnection = null;

cache.getOrSet = async (keys, asyncFetchData, expire = null) => {
    const key = keys.join(":");
    const value = await get(key);
    if (value) return JSON.parse(value);

    const data = await asyncFetchData();
    cache.set(keys, data, expire);
    return data;
};

cache.set = async (keys, data, expire = null) => {
    const key = keys.join(":");

    console.log("\n   cache set", key);
    if (expire) {
        await set(key, JSON.stringify(data), "EX", expire);
    } else {
        await set(key, JSON.stringify(data));
    }
};

cache.delByPrefix = async (prefixes) => {
    const prefix = prefixes.join(":");
    const rows = await keys(prefix + "*");
    if (rows.length) console.log("delByPrefix", rows);
    await Promise.all(rows.map(key => del(key)));
};

const addPollInvalidationListeners = async (aeternity) => {
    const polls = await aeternity.polls();
    polls.forEach(([_, data]) => addPollInvalidationListener(data.poll));
};

const addPollInvalidationListener = async (poll) => {
    if (cache.wsconnection) {
        cache.wsconnection.send(JSON.stringify({op: "subscribe", payload: "object", target: poll}));
    } else {
        setTimeout(addPollInvalidationListener(poll), 30000);
    }
};

const handleContractEvent = async (event) => {
    console.log("handleContractEvent", event);
    switch (event.topic) {
        case "AddPoll":
            await cache.delByPrefix(["polls"]);
            addPollInvalidationListener(event.poll);
            break;
        case "Delegation":
            await cache.delByPrefix(["delegations"]);
            break;
            case "RevokeDelegation":
            await cache.delByPrefix(["delegations"]);
            break;
        case "Vote":
            await cache.delByPrefix(["pollOverview", event.poll]);
            await cache.delByPrefix(["pollStateAndVotingAccounts", event.poll]);
            break;
        case "RevokeVote":
            await cache.delByPrefix(["pollOverview", event.poll]);
            await cache.delByPrefix(["pollStateAndVotingAccounts", event.poll]);
            break;
    }
};

cache.startInvalidator = (aeternity) => {
    addPollInvalidationListeners(aeternity);
    const wsclient = new WebSocketClient();
    wsclient.connect("ws://127.0.0.1:3020");
    wsclient.on('connect', connection => {
        cache.wsconnection = connection;
        cache.wsconnection.send(JSON.stringify({op: "subscribe", payload: "key_blocks"}));
        cache.wsconnection.send(JSON.stringify({
            op: "subscribe",
            payload: "object",
            target: aeternity.contractAddress
        }));
        cache.wsconnection.on('message', async message => {
            if (message.type === 'utf8' && message.utf8Data.includes("payload")) {
                const data = JSON.parse(message.utf8Data);
                if (data.subscription === "key_blocks") {
                    await cache.delByPrefix(["height"]);
                }
                if (data.subscription === "object") {
                    const event = await aeternity.transactionEvent(data.payload.hash);
                    if (event) handleContractEvent(event);
                }
            }
        });
    });
};

module.exports = cache;
