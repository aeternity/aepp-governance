const fs = require('fs');
const Universal = require('@aeternity/aepp-sdk').Universal;
const BigNumber = require('bignumber.js');
const axios = require('axios');

const cache = require('./cache');

const registryContractSource = fs.readFileSync(__dirname + "/../../governance-contracts/contracts/Registry.aes", "utf-8");
const pollContractSource = fs.readFileSync(__dirname + "/../../governance-contracts/contracts/Poll.aes", "utf-8");

const aeternity = {};

aeternity.nodeUrl = "http://localhost:3001/";
//aeternity.nodeUrl = "https://sdk-testnet.aepps.com/";

aeternity.init = async () => {
    aeternity.client = await Universal({
        url: aeternity.nodeUrl,
        internalUrl: aeternity.nodeUrl,
        compilerUrl: "http://localhost:3080"
    });

    aeternity.contract = await aeternity.client.getContractInstance(registryContractSource, {contractAddress: 'ct_2kWCEEgo35ic93wAfpeaugVKeYYyaupCUQHs3u6YUDHLQPRcUd'})
    console.log("initialized aeternity sdk")
};

aeternity.polls = async () => {
    return cache.getOrSet(["polls"], async () => (await aeternity.contract.methods.polls()).decodedResult, true);
};

aeternity.pollState = async (address) => {
    if (!aeternity.client) await aeternity.init();

    const pollContract = await aeternity.client.getContractInstance(pollContractSource, {contractAddress: address.replace("ak_", "ct_")});
    const pollState = await pollContract.methods.get_state();
    return pollState.decodedResult;
};

aeternity.delegators = async (address) => {
    const delegations = await aeternity.delegations();
    return delegations.filter(([_, delegatee]) => delegatee === address);
};

aeternity.delegations = async () => {
    return cache.getOrSet(["delegations"], async () => (await aeternity.contract.methods.delegations()).decodedResult, true);
};

aeternity.tokenSupply = async (height) => {
    return cache.getOrSet(["totalSupply", height], async () => {
        const result = await axios.get(`${aeternity.nodeUrl}v2/debug/token-supply/height/${height}`);
        return new BigNumber(result.data.total).toFixed();
    });
};

aeternity.height = async () => {
    return cache.getOrSet(["height"], () => aeternity.client.height(), true);
};

module.exports = aeternity;
