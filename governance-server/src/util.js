const BN = require('bn.js');
const blake2b = require('blake2b');
const Crypto = require('@aeternity/aepp-sdk').Crypto;
const BigNumber = require('bignumber.js');

const util = {};

util.atomsToAe = (atoms) => (new BigNumber(atoms)).dividedBy(new BigNumber(1000000000000000000));

util.groupBy = (xs, key) => xs.reduce((acc, x) => Object.assign({}, acc, {
    [x[key]]: (acc[x[key]] || []).concat(x)
}), {});

util.hashTopic = topic => blake2b(32).update(Buffer.from(topic)).digest('hex');

util.bigNumberToByteArray = (x) => {
    let hexString = x.toString(16)
    if (hexString.length % 2 > 0) hexString = '0' + hexString
    return Buffer.from(hexString, 'hex')
};

util.toBytes = (val, big = false) => {
    // """
    // Encode a value to bytes.
    // If the value is an int it will be encoded as bytes big endian
    // Raises ValueError if the input is not an int or string

    if (val === undefined) return undefined;
    if (Number.isInteger(val) || BigNumber.isBigNumber(val) || big) {
        if (!BigNumber.isBigNumber(val)) val = BigNumber(val);
        return util.bigNumberToByteArray(val)
    }
    if (typeof val === 'string') {
        return val.toString('utf-8')
    }
    throw new Error('Byte serialization not supported')
};

util.topicHashFromResult = log => util.toBytes(log[0].topics[0], true).toString('hex');

util.eventArgument = (log, index) => log[0].topics[index + 1];

util.encodeEventAddress = (log, index, prefix) => `${prefix}${Crypto.encodeBase58Check(new BN(util.eventArgument(log, index)).toBuffer('be', 32))}`;

util.range = (start, end) => (new Array(end - start + 1)).fill(undefined).map((_, i) => i + start);

Array.prototype.asyncMap = async function (asyncF) {
    return this.reduce(async (promiseAcc, cur, i) => {
        const acc = await promiseAcc;
        const res = await asyncF(cur).catch(e => {
            console.error("asyncMap asyncF", e.message);
            return null;
        });
        if (i % 100 === 0) console.log("asyncMap", `${i}/${this.length} (${Math.round((i / this.length) * 100)}%)`);
        if (Array.isArray(res)) {
            return acc.concat(res);
        } else {
            if (res) acc.push(res);
            return acc;
        }
    }, Promise.resolve([]));
};

module.exports = util;


