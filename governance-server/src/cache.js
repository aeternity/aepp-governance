var redis = require("redis"),
    client = redis.createClient();
const {promisify} = require('util');
const get = promisify(client.get).bind(client);
const set = promisify(client.set).bind(client);

const cache = {};

const KeyHeightOrTime = (height, data) => height ? KeyHeight(height, data) : KeyTime(data);
const KeyHeight = (height, data) => (height / 10).toFixed() + (data ? data : "");
const KeyTime = (data) => (new Date().getTime() / 30000).toFixed() + (data ? data : "");

cache.getOrSet = async (keys, asyncFetchData, expire = false) => {
    const key = keys.join(":");
    const value = await get(key);
    if (value) return JSON.parse(value);

    const data = await asyncFetchData();
    console.log("\n   cache set", key);
    if (expire) {
        await set(key, JSON.stringify(data), "EX", 60);
    } else {
        await set(key, JSON.stringify(data));
    }
    return data;
};

module.exports = cache;
