const redis = require("redis");
const client = redis.createClient();
const {promisify} = require('util');
const get = promisify(client.get).bind(client);
const set = promisify(client.set).bind(client);
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

cache.startInvalidator = (aeternity) => {
    const wsclient = new WebSocketClient();
    wsclient.connect("ws://127.0.0.1:3020");
    wsclient.on('connect', connection => {
        const subscribe = JSON.stringify({op: "subscribe", payload: "object", target: aeternity.contractAddress});
        connection.send(subscribe);
        connection.on('message', async message => {
            if (message.type === 'utf8' && message.utf8Data.includes("payload")) {
                const data = JSON.parse(message.utf8Data);
                const event = await aeternity.transactionEvent(data.payload.hash);
                console.log(event);
            }
        });
    });
};

module.exports = cache;
