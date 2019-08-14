const fs = require('fs');
const Universal = require('@aeternity/aepp-sdk').Universal;
const BigNumber = require('bignumber.js');
const axios = require('axios');

const cache = require('./cache');
const util = require("./util");

const registryContractSource = fs.readFileSync(__dirname + "/../../governance-contracts/contracts/Registry.aes", "utf-8");
const pollContractSource = fs.readFileSync(__dirname + "/../../governance-contracts/contracts/Poll.aes", "utf-8");

const aeternity = {};

aeternity.contractAddress = "ct_2T5Mks5YXoWQzuvMdABPXt1aEaycCkoMANsSsv7F89fpNw44Nt";
aeternity.nodeUrl = "http://localhost:3001/";
//aeternity.nodeUrl = "https://sdk-testnet.aepps.com/";

aeternity.init = async () => {
    aeternity.client = await Universal({
        url: aeternity.nodeUrl,
        internalUrl: aeternity.nodeUrl,
        compilerUrl: "http://localhost:3080"
    });

    aeternity.contract = await aeternity.client.getContractInstance(registryContractSource, {contractAddress: aeternity.contractAddress});
    console.log("initialized aeternity sdk")
};

aeternity.polls = async () => {
    return cache.getOrSet(["polls"], async () => (await aeternity.contract.methods.polls()).decodedResult, 60);
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
    return cache.getOrSet(["delegations"], async () => (await aeternity.contract.methods.delegations()).decodedResult, 60);
};

aeternity.tokenSupply = async (height) => {
    return cache.getOrSet(["totalSupply", height], async () => {
        const result = await axios.get(`${aeternity.nodeUrl}v2/debug/token-supply/height/${height}`);
        return new BigNumber(result.data.total).toFixed();
    });
};

aeternity.height = async () => {
    return cache.getOrSet(["height"], () => aeternity.client.height(), 30);
};

aeternity.transactionEvent = async (hash) => {
    const tx = await aeternity.client.getTxInfo(hash);
    if (tx.log.length === 1) {
        const topics = ["AddPoll", "Delegation", "RevokeDelegation"];
        const topic = topics.find(topic => util.hashTopic(topic) === util.topicHashFromResult(tx.log));
        switch (topic) {
            case "AddPoll":
                return {
                    topic: topic,
                    poll: util.encodeEventAddress(tx.log, 0, "ct_"),
                    seq_id: util.eventArgument(tx.log, 1)
                };
            case "Delegation":
                return {
                    topic: topic,
                    delegator: util.encodeEventAddress(tx.log, 0, "ak_"),
                    delegatee: util.encodeEventAddress(tx.log, 1, "ak_")
                };
            case "RevokeDelegation":
                return {
                    topic: topic,
                    delegator: util.encodeEventAddress(tx.log, 0, "ak_"),
                };
            default:
                return {topic: topic};
        }
    }
    return null;
};

module.exports = aeternity;
