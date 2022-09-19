const mock = {};

mock.cache = [];

mock.getOrSet = async (keys, asyncFetchData, expire = null) => {
    const key = keys.join(":");
    const value = mock.cache[key];
    if (value) return JSON.parse(value);

    const data = await asyncFetchData();
    await mock.set(keys, data, expire);
    return data;
};

mock.set = async (keys, data, expire = null) => {
    const key = keys.join(":");
    mock.cache[key] = JSON.stringify(data);
};


module.exports = mock;
