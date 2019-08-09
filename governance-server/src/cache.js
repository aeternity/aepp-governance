var redis = require("redis"),
    client = redis.createClient();
const {promisify} = require('util');
const get = promisify(client.get).bind(client);
const set = promisify(client.set).bind(client);

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

module.exports = cache;
