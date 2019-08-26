const fs = require('fs');
const Universal = require('@aeternity/aepp-sdk').Universal;
const BigNumber = require('bignumber.js');
const axios = require('axios');

const cache = require('./cache');
const util = require("./util");

const registryContractSource = fs.readFileSync(__dirname + "/../../governance-contracts/contracts/Registry.aes", "utf-8");
const pollContractSource = fs.readFileSync(__dirname + "/../../governance-contracts/contracts/Poll.aes", "utf-8");

const aeternity = {};

aeternity.contractAddress = "ct_2nbxa4N2NCrbmtN7SMdYG1xfsc1trAVRdQe21cPmHu8CfiUDWs";
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

aeternity.registryCreationHeight = async () => {
    return (await aeternity.contract.methods.created_height()).decodedResult
};

aeternity.polls = async () => {
    await aeternity.init();
    return cache.getOrSet(["polls"], async () => (await aeternity.contract.methods.polls()).decodedResult, 120);
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
    return cache.getOrSet(["delegations"], async () => (await aeternity.contract.methods.delegations()).decodedResult, 120);
};

aeternity.tokenSupply = async (height) => {
    return cache.getOrSet(["totalSupply", height], async () => {
        const result = await axios.get(`${aeternity.nodeUrl}v2/debug/token-supply/height/${height}`);
        return new BigNumber(result.data.total).toFixed();
    }, 3600);
};

aeternity.height = async () => {
    return cache.getOrSet(["height"], () => aeternity.client.height(), 120);
};

aeternity.transactionEvent = async (hash) => {
    const tx = await aeternity.client.getTxInfo(hash);
    if (tx.log.length === 1) {
        const topics = ["AddPoll", "Delegation", "RevokeDelegation", "Vote", "RevokeVote"];
        const topic = topics.find(topic => util.hashTopic(topic) === util.topicHashFromResult(tx.log));
        switch (topic) {
            case "AddPoll":
                return {
                    topic: topic,
                    height: tx.height,
                    poll: util.encodeEventAddress(tx.log, 0, "ct_"),
                    seq_id: util.eventArgument(tx.log, 1)
                };
            case "Delegation":
                return {
                    topic: topic,
                    height: tx.height,
                    delegator: util.encodeEventAddress(tx.log, 0, "ak_"),
                    delegatee: util.encodeEventAddress(tx.log, 1, "ak_")
                };
            case "RevokeDelegation":
                return {
                    topic: topic,
                    height: tx.height,
                    delegator: util.encodeEventAddress(tx.log, 0, "ak_"),
                };
            case "Vote":
                return {
                    topic: topic,
                    height: tx.height,
                    poll: util.encodeEventAddress(tx.log, 0, "ct_"),
                    voter: util.encodeEventAddress(tx.log, 1, "ak_"),
                    option: util.eventArgument(tx.log, 2)
                };
            case "RevokeVote":
                return {
                    topic: topic,
                    height: tx.height,
                    poll: util.encodeEventAddress(tx.log, 0, "ct_"),
                    voter: util.encodeEventAddress(tx.log, 1, "ak_"),
                };

            default:
                return {topic: topic};
        }
    }
    return null;
};

module.exports = aeternity;
