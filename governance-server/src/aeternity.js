const fs = require('fs');
const Universal = require('@aeternity/aepp-sdk').Universal;
const BigNumber = require('bignumber.js');
const axios = require('axios');

const util = require("./util");
const delegationLogic = require("./delegation_logic");

const registryContractSource = fs.readFileSync(__dirname + "/../etc/RegistryInterface.aes", "utf-8");
const pollContractSource = fs.readFileSync(__dirname + "/../etc/PollInterface.aes", "utf-8");

module.exports = class Aeternity {
    cache;
    client;

    constructor(verifyConstants = null) {
        this.verifyConstants = verifyConstants;
        this.cache = this.verifyConstants ? require('./mock') : require('./cache');

        if (!this.verifyConstants && !process.env.NODE_URL) throw "NODE_URL is not set";
        if (!this.verifyConstants && !process.env.COMPILER_URL) throw "COMPILER_URL is not set";
        if (!this.verifyConstants && !process.env.CONTRACT_ADDRESS) throw "CONTRACT_ADDRESS is not set";
    }

    init = async () => {
        if (!this.client) {
            this.client = await Universal({
                url: process.env.NODE_URL || this.verifyConstants.nodeUrl,
                internalUrl: process.env.NODE_URL || this.verifyConstants.nodeUrl,
                compilerUrl: process.env.COMPILER_URL || this.verifyConstants.compilerUrl
            });

            this.contract = await this.client.getContractInstance(registryContractSource, {contractAddress: process.env.CONTRACT_ADDRESS || this.verifyConstants.registryContract});
            console.log("initialized aeternity sdk");
        }
    };

    registryCreationHeight = async () => {
        return this.cache.getOrSet(["registryCreationHeight"], async () => {
            process.stdout.write(".");
            return (await this.contract.methods.created_height()).decodedResult
        });
    };

    middlewareContractTransactions = async (height) => {
        return axios.get(`${process.env.MIDDLEWARE_URL}/middleware/contracts/transactions/address/${process.env.CONTRACT_ADDRESS || this.verifyConstants.registryContract}`)
            .then(res => res.data.transactions
                .filter(tx => tx.tx.type === "ContractCallTx")
                .filter(tx => tx.block_height <= height)
                .map(tx => tx.hash));
    };

    microBlocks = async (height) => {
        return this.cache.getOrSet(["microBlocks", height], async () => {
            try {
                return (await this.client.getGeneration(height)).microBlocks
            } catch (e) {
                console.error(e);
                return [];
            }
        }, this.cache.longCacheTime);
    };

    contractTransactionHashes = async (hash) => {
        return this.cache.getOrSet(["contractTransactionHashes", hash], async () => {
            process.stdout.write(";");
            const txs = (await this.client.getMicroBlockTransactions(hash));
            return txs.filter(tx => tx.tx.contractId === (process.env.CONTRACT_ADDRESS || this.verifyConstants.registryContract)).map(tx => tx.hash);
        });
    };

    polls = async () => {
        return this.cache.getOrSet(["polls"], async () => (await this.contract.methods.polls()).decodedResult, this.cache.shortCacheTime);
    };

    pollState = async (address) => {
        const pollContract = await this.client.getContractInstance(pollContractSource, {contractAddress: address.replace("ak_", "ct_")});
        const pollState = await pollContract.methods.get_state();
        return pollState.decodedResult;
    };

    delegators = async (address, height) => {
        const delegations = await this.delegations(height);
        return delegations.filter(([_, delegatee]) => delegatee === address);
    };

    delegatee = async (address, height) => {
        const delegations = await this.delegations(height);
        return delegations.filter(([delegator, _]) => delegator === address);
    };

    getClosingHeightOrUndefined = async (pollCloseHeight) => {
        const height = await this.height();
        return pollCloseHeight ? pollCloseHeight <= height ? pollCloseHeight : undefined : undefined;
    };

    delegations = async (pollCloseHeight) => {
        const closingHeightOrUndefined = await this.getClosingHeightOrUndefined(pollCloseHeight);

        if (closingHeightOrUndefined) {
            return this.cache.getOrSet(["delegations", closingHeightOrUndefined], async () => {
                const delegationEvents = await delegationLogic.findDelegationEvents(this.cache, this, closingHeightOrUndefined);
                return delegationLogic.calculateDelegations(delegationEvents);
            }, this.cache.longCacheTime);
        } else {
            return this.cache.getOrSet(["delegations", closingHeightOrUndefined], async () => (await this.contract.methods.delegations()).decodedResult, this.cache.shortCacheTime);
        }
    };

    tokenSupply = async (pollCloseHeight) => {
        const height = await this.height();
        const closingHeightOrUndefined = await this.getClosingHeightOrUndefined(pollCloseHeight);
        const closingHeightOrCurrentHeight = closingHeightOrUndefined ? closingHeightOrUndefined : height;

        return this.cache.getOrSet(["totalSupply", (closingHeightOrCurrentHeight / 1000).toFixed()], async () => {
            const result = await axios.get(`${process.env.NODE_URL || this.verifyConstants.nodeUrl}v2/debug/token-supply/height/${closingHeightOrCurrentHeight}`);
            return new BigNumber(result.data.total).toFixed();
        });
    };

    height = async () => {
        return this.cache.getOrSet(["height"], () => this.client.height(), this.cache.shortCacheTime);
    };

    transactionEvent = async (hash) => {
        return this.cache.getOrSet(["transactionEvent", hash], async () => {
            process.stdout.write(",");
            const tx = await this.client.getTxInfo(hash);
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
        })
    };
};

