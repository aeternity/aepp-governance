const redis = require("redis");
const client = redis.createClient();
const {promisify} = require('util');
const get = promisify(client.get).bind(client);
const set = promisify(client.set).bind(client);
const del = promisify(client.del).bind(client);
const keys = promisify(client.keys).bind(client);
const WebSocketClient = require('websocket').client;

const cache = {};

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

cache.delByPrefix = async (prefix) => {
    const rows = await keys(prefix + "*");
    console.log("delByPrefix", rows);
    await Promise.all(rows.map(key => del(key)));
};

cache.startInvalidator = (aeternity) => {
    const wsclient = new WebSocketClient();
    wsclient.connect("ws://127.0.0.1:3020");
    wsclient.on('connect', connection => {
        connection.send(JSON.stringify({op: "subscribe", payload: "key_blocks"}));
        connection.send(JSON.stringify({op: "subscribe", payload: "object", target: aeternity.contractAddress}));
        connection.on('message', async message => {
            if (message.type === 'utf8' && message.utf8Data.includes("payload")) {
                const data = JSON.parse(message.utf8Data);
                if (data.subscription === "key_blocks") {
                    await cache.delByPrefix("height");
                }
                if (data.subscription === "object") {
                    const event = await aeternity.transactionEvent(data.payload.hash);
                    if (event) cache.invalidate(event);
                }
            }
        });
    });
};

cache.invalidate = async (event) => {
    console.log("invalidate", event);
    switch (event.topic) {
        case "AddPoll":
            await cache.delByPrefix("polls");
            break;
        case "Delegation":
            await cache.delByPrefix("delegations");
            break;
        case "RevokeDelegation":
            await cache.delByPrefix("delegations");
            break;
    }
};

module.exports = cache;
