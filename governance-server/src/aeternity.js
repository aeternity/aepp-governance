const fs = require('fs');
const {Universal, Node} = require('@aeternity/aepp-sdk');
const axios = require('axios');

const util = require("./util");
const delegationLogic = require("./delegation_logic");
const {totalSupplyAtHeight} = require("./coinbase");

const registryContractInterface = fs.readFileSync(__dirname + "/../etc/RegistryInterface.aes", "utf-8");
const pollContractInterface = fs.readFileSync(__dirname + "/../etc/PollInterface.aes", "utf-8");
const pollContractSource = fs.readFileSync(__dirname + "/../etc/Poll.aes", "utf-8");
const pollIrisContractSource = fs.readFileSync(__dirname + "/../etc/Poll_Iris.aes", "utf-8");

const compilers = [
    {url: 'https://v400.compiler.aeternity.art', version: 'v4.0.0', pragma: 4},
    {url: 'https://v410.compiler.aeternity.art', version: 'v4.1.0', pragma: 4},
    {url: 'https://v420.compiler.aeternity.art', version: 'v4.2.0', pragma: 4},
    {url: 'https://v421.compiler.aeternity.art', version: 'v4.2.1', pragma: 4},
    {url: 'https://v430.compiler.aeternity.art', version: 'v4.3.0', pragma: 4},
    {url: 'https://v500.compiler.aeternity.art', version: 'v5.0.0', pragma: 5},
    {url: 'https://v600.compiler.aeternity.art', version: 'v6.0.0', pragma: 6},
    {url: 'https://v601.compiler.aeternity.art', version: 'v6.0.1', pragma: 6},
    {url: 'https://v602.compiler.aeternity.art', version: 'v6.0.2', pragma: 6},
];

const tempCallOptions = { gas: 100000000000 };

module.exports = class Aeternity {
    cache;
    client;
    pollContracts = {};

    constructor(verifyConstants = null) {
        this.verifyConstants = verifyConstants;
        this.cache = this.verifyConstants ? require('./mock') : require('./cache');

        if (!this.verifyConstants && !process.env.NODE_URL) throw "NODE_URL is not set";
        if (!this.verifyConstants && !process.env.COMPILER_URL) throw "COMPILER_URL is not set";
        if (!this.verifyConstants && !process.env.CONTRACT_ADDRESS) throw "CONTRACT_ADDRESS is not set";
    }

    contractAddress = process.env.CONTRACT_ADDRESS || this.verifyConstants.registryContract;

    init = async () => {
        if (!this.client) {
            this.client = await Universal({
                compilerUrl: process.env.COMPILER_URL || this.verifyConstants.compilerUrl,
                nodes: [{
                    name: 'node',
                    instance: await Node({
                        url: process.env.NODE_URL || this.verifyConstants.nodeUrl,
                    }),
                }],
            });

            this.contract = await this.client.getContractInstance(registryContractInterface, {contractAddress: this.contractAddress});
            this.client.api.protectedDryRunTxs = this.client.api.dryRunTxs;

            console.log("initialized aeternity sdk");
        }
    };

    networkId = async () => {
        return (await this.client.getNodeInfo()).nodeNetworkId
    };

    verifyPollContract = async (pollAddress) => {
        const result = async () => {
            try {
                const contractCreateBytecode = await axios.get(`${process.env.MIDDLEWARE_URL}/txs/backward/and?contract=${pollAddress}&type=contract_create`).then(async res => {
                    if (!res.data) return null;
                    const contractCreateTx = res.data.data[0];
                    return contractCreateTx ? contractCreateTx.tx.code : null;
                });

                const testCompilers = async (compilers, source) => {
                    return Promise.all(compilers.map(compiler => {
                        return axios.post(`${compiler.url}/compile`, {
                            code: source,
                            options: {backend: 'fate'}
                        }).then(async res => {
                            const bytecode = res.data.bytecode;
                            return {
                                bytecode: bytecode,
                                contractCreateBytecode: contractCreateBytecode,
                                matches: bytecode === contractCreateBytecode,
                                version: compiler.version
                            }
                        });
                    }));
                };

                const compilers4Result = await testCompilers(compilers.filter(c => c.pragma === 4), pollContractSource);
                const compilers5Result = await testCompilers(compilers.filter(c => c.pragma === 5), pollIrisContractSource);
                const compilers6Result = await testCompilers(compilers.filter(c => c.pragma === 6), pollIrisContractSource);

                return compilers4Result
                  .concat(compilers5Result)
                  .concat(compilers6Result)
                  .find(test => test.matches) || false;
            } catch (e) {
                console.error("verifyPollContract", e);
                return false;
            }
        };

        return this.cache.getOrSet(["verifyPollContract", pollAddress], result, this.cache.longCacheTime);
    };

    registryCreationHeight = async () => {
        return this.cache.getOrSet(["registryCreationHeight"], async () => {
            process.stdout.write(".");
            return (await this.contract.methods.created_height()).decodedResult
        });
    };

    iterateMdw = async (next) => {
        const result = await axios.get(`${process.env.MIDDLEWARE_URL}/${next}`).then(res => res.data);
        if (result.next) {
            return result.data.concat(await this.iterateMdw(result.next));
        }
        return result.data;
    }

    middlewareContractTransactions = (height) => {
        return this.iterateMdw(`txs/gen/${height}-0?contract=${this.contractAddress}&type=contract_call&limit=1000`);
    }

    nodeContractTransactions = async (registryCreationHeight, height) => {
        const contractTransactionsForRange = async (range) => {
            const rangeLastHeight = range[range.length - 1];
            return this.cache.getOrSet(["contractTransactionsForRange", range[0], rangeLastHeight], async () => {
                const microBlockHashes = await range.asyncMap(this.microBlocks);
                return microBlockHashes.asyncMap(this.contractTransactionHashes);
            }, rangeLastHeight === height ? this.cache.shortCacheTime : null);
        };

        const steppedRanges = util.steppedRanges(registryCreationHeight, height, 100);
        return steppedRanges.asyncMap(contractTransactionsForRange);
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
            return txs.filter(tx => tx.tx.contractId === this.contractAddress).map(tx => ({hash: tx.hash}));
        });
    };

    polls = async () => {
        return this.cache.getOrSet(["polls"], async () => (await this.contract.methods.polls(tempCallOptions)).decodedResult, this.cache.shortCacheTime);
    };

    pollState = async (address) => {
        const pollAddress = address.replace("ak_", "ct_");
        const pollContract = this.pollContracts[pollAddress] ? this.pollContracts[pollAddress] : await this.client.getContractInstance(pollContractInterface, {contractAddress: pollAddress}).then(contract => {
            this.pollContracts[pollAddress] = contract;
            return contract;
        });

        const pollState = await pollContract.methods.get_state(tempCallOptions);
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
            return this.cache.getOrSet(["delegations", closingHeightOrUndefined], async () => (await this.contract.methods.delegations(tempCallOptions)).decodedResult, this.cache.shortCacheTime);
        }
    };

    tokenSupply = async (pollCloseHeight) => {
        const height = await this.height();
        const closingHeightOrUndefined = await this.getClosingHeightOrUndefined(pollCloseHeight);
        const closingHeightOrCurrentHeight = closingHeightOrUndefined ? closingHeightOrUndefined : height;

        return this.cache.getOrSet(["totalSupply", closingHeightOrCurrentHeight], async () => {
            const networkId = await this.networkId();
            return totalSupplyAtHeight(this.cache, networkId, closingHeightOrCurrentHeight);
        });
    };

    height = async () => {
        return this.cache.getOrSet(["height"], () => this.client.height(), this.cache.shortCacheTime);
    };

    transactionEvent = async ({hash, tx}) => {
        return this.cache.getOrSet(["transactionEvent", hash || tx.hash], async () => {
            process.stdout.write(",");
            const {height, nonce, log} = hash
              ? await this.client.getTxInfo(hash).then(res => ({height: res.height, nonce: res.callerNonce, log: res.log}))
              : ({height: tx.block_height, nonce: tx.tx.nonce, log: tx.tx.log})
            if (log.length === 1) {
                const topics = ["AddPoll", "Delegation", "RevokeDelegation", "Vote", "RevokeVote"];
                const topic = topics.find(topic => util.hashTopic(topic) === util.topicHashFromResult(log));
                switch (topic) {
                    case "AddPoll":
                        return {
                            topic: topic,
                            height: height,
                            nonce: nonce ,
                            poll: util.encodeEventAddress(log, 0, "ct_"),
                            seq_id: util.eventArgument(log, 1)
                        };
                    case "Delegation":
                        return {
                            topic: topic,
                            height: height,
                            nonce: nonce,
                            delegator: util.encodeEventAddress(log, 0, "ak_"),
                            delegatee: util.encodeEventAddress(log, 1, "ak_")
                        };
                    case "RevokeDelegation":
                        return {
                            topic: topic,
                            height: height,
                            nonce: nonce,
                            delegator: util.encodeEventAddress(log, 0, "ak_"),
                        };
                    case "Vote":
                        return {
                            topic: topic,
                            height: height,
                            nonce: nonce,
                            poll: util.encodeEventAddress(log, 0, "ct_"),
                            voter: util.encodeEventAddress(log, 1, "ak_"),
                            option: util.eventArgument(log, 2)
                        };
                    case "RevokeVote":
                        return {
                            topic: topic,
                            height: height,
                            nonce: nonce,
                            poll: util.encodeEventAddress(log, 0, "ct_"),
                            voter: util.encodeEventAddress(log, 1, "ak_"),
                        };

                    default:
                        return {topic: topic};
                }
            }
            return null;
        })
    };
};

