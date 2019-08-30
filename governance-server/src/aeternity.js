const fs = require('fs');
const Universal = require('@aeternity/aepp-sdk').Universal;
const BigNumber = require('bignumber.js');
const axios = require('axios');

const cache = require('./cache');
const util = require("./util");
const delegationLogic = require("./delegation_logic");

const registryContractSource = fs.readFileSync(__dirname + "/../etc/Registry.aes", "utf-8");
const pollContractSource = fs.readFileSync(__dirname + "/../etc/Poll.aes", "utf-8");

const aeternity = {};

if (!process.env.NODE_URL) throw "AETERNITY_URL is not set";
if (!process.env.COMPILER_URL) throw "COMPILER_URL is not set";
if (!process.env.CONTRACT_ADDRESS) throw "CONTRACT_ADDRESS is not set";
aeternity.contractAddress = process.env.CONTRACT_ADDRESS;

aeternity.init = async () => {
    aeternity.client = await Universal({
        url: process.env.NODE_URL,
        internalUrl: process.env.NODE_URL,
        compilerUrl: process.env.COMPILER_URL
    });

    aeternity.contract = await aeternity.client.getContractInstance(registryContractSource, {contractAddress: aeternity.contractAddress});
    console.log("initialized aeternity sdk")
};

aeternity.registryCreationHeight = async () => {
    return cache.getOrSet(["registryCreationHeight"], async () => {
        process.stdout.write(".");
        return (await aeternity.contract.methods.created_height()).decodedResult
    }, 3600);
};

aeternity.microBlocks = async (height) => {
    return cache.getOrSet(["microBlocks", height], async () => {
        try {
            return (await aeternity.client.getGeneration(height)).microBlocks
        } catch (e) {
            console.error(e);
            return [];
        }
    }, 3600);
};

aeternity.contractTransactionHashes = async (hash) => {
    return cache.getOrSet(["contractTransactionHashes", hash], async () => {
        process.stdout.write(";");
        const txs = (await aeternity.client.getMicroBlockTransactions(hash));
        return txs.filter(tx => tx.tx.contractId === aeternity.contractAddress).map(tx => tx.hash);
    }, 3600);
};

aeternity.polls = async () => {
    if (!aeternity.client) await aeternity.init();
    return cache.getOrSet(["polls"], async () => (await aeternity.contract.methods.polls()).decodedResult, 120);
};

aeternity.pollState = async (address) => {
    if (!aeternity.client) await aeternity.init();

    const pollContract = await aeternity.client.getContractInstance(pollContractSource, {contractAddress: address.replace("ak_", "ct_")});
    const pollState = await pollContract.methods.get_state();
    return pollState.decodedResult;
};

aeternity.delegators = async (address, height) => {
    const delegations = await aeternity.delegations(height);
    return delegations.filter(([_, delegatee]) => delegatee === address);
};

const getClosingHeightOrUndefined = async (pollCloseHeight) => {
    const height = await aeternity.height();
    return pollCloseHeight ? pollCloseHeight <= height ? pollCloseHeight : undefined : undefined;
};

aeternity.delegations = async (pollCloseHeight) => {
    const closingHeightOrUndefined = await getClosingHeightOrUndefined(pollCloseHeight);
    return cache.getOrSet(["delegations", closingHeightOrUndefined], async () => {
        if (closingHeightOrUndefined) {
            const delegationEvents = await delegationLogic.findDelegationEvents(aeternity, closingHeightOrUndefined);
            return delegationLogic.calculateDelegations(delegationEvents);
        } else {
            return (await aeternity.contract.methods.delegations()).decodedResult
        }
    }, 3600);
};

aeternity.tokenSupply = async (pollCloseHeight) => {
    const height = await aeternity.height();
    const closingHeightOrUndefined = await getClosingHeightOrUndefined(pollCloseHeight);
    const closingHeightOrCurrentHeight = closingHeightOrUndefined ? closingHeightOrUndefined : height;

    return cache.getOrSet(["totalSupply", (closingHeightOrCurrentHeight / 100).toFixed()], async () => {
        const result = await axios.get(`${process.env.NODE_URL}v2/debug/token-supply/height/${closingHeightOrCurrentHeight}`);
        return new BigNumber(result.data.total).toFixed();
    }, 3600);
};

aeternity.height = async () => {
    return cache.getOrSet(["height"], () => aeternity.client.height(), 120);
};

aeternity.transactionEvent = async (hash) => {
    return cache.getOrSet(["transactionEvent", hash], async () => {
        process.stdout.write(",");
        const tx = await aeternity.client.getTxInfo(hash);
        if (tx.log.length === 1) {
            const topics = ["AddPoll", "Delegation", "RevokeDelegation", "Vote", "RevokeVote"];
            const topic = topics.find(topic => util.hashTopic(topic) === util.topicHashFromResult(tx.log));
            switch (topic) {
                case "AddPoll":
                    return {
                        topic: topic,
                        height: tx.height,
                        nonce: tx.callerNonce,
                        poll: util.encodeEventAddress(tx.log, 0, "ct_"),
                        seq_id: util.eventArgument(tx.log, 1)
                    };
                case "Delegation":
                    return {
                        topic: topic,
                        height: tx.height,
                        nonce: tx.callerNonce,
                        delegator: util.encodeEventAddress(tx.log, 0, "ak_"),
                        delegatee: util.encodeEventAddress(tx.log, 1, "ak_")
                    };
                case "RevokeDelegation":
                    return {
                        topic: topic,
                        height: tx.height,
                        nonce: tx.callerNonce,
                        delegator: util.encodeEventAddress(tx.log, 0, "ak_"),
                    };
                case "Vote":
                    return {
                        topic: topic,
                        height: tx.height,
                        nonce: tx.callerNonce,
                        poll: util.encodeEventAddress(tx.log, 0, "ct_"),
                        voter: util.encodeEventAddress(tx.log, 1, "ak_"),
                        option: util.eventArgument(tx.log, 2)
                    };
                case "RevokeVote":
                    return {
                        topic: topic,
                        height: tx.height,
                        nonce: tx.callerNonce,
                        poll: util.encodeEventAddress(tx.log, 0, "ct_"),
                        voter: util.encodeEventAddress(tx.log, 1, "ak_"),
                    };

                default:
                    return {topic: topic};
            }
        }
        return null;
    }, 3600)
};

module.exports = aeternity;
