const {AeSdk, Node} = require('@aeternity/aepp-sdk');

const util = require("./util");
const delegationLogic = require("./delegation_logic");
const {totalSupplyAtHeight} = require("./coinbase");

const registryWithEventsAci = require("../../governance-contracts/generated/RegistryWithEventsACI.json");
const pollAci = require("../../governance-contracts/generated/PollACI.json");
const byteCodeHashes = require("../../governance-contracts/generated/bytecode_hashes.json");
const crypto = require("crypto");

module.exports = class Aeternity {
    cache;
    client;
    pollContracts = {};
    contractAddress;

    constructor(verifyConstants = null) {
        this.verifyConstants = verifyConstants;
        this.cache = this.verifyConstants ? require('./mock') : require('./cache');

        if (!this.verifyConstants && !process.env.NODE_URL) throw "NODE_URL is not set";
        if (!this.verifyConstants && !process.env.CONTRACT_ADDRESS) throw "CONTRACT_ADDRESS is not set";

        this.contractAddress = process.env.CONTRACT_ADDRESS || this.verifyConstants.registryContract;
    }


    init = async () => {
        if (!this.client || !this.contract) {
            this.client = new AeSdk({
                nodes: [{
                    name: 'node', instance: new Node(process.env.NODE_URL || this.verifyConstants.nodeUrl),
                }],
            });

            this.contract = await this.client.initializeContract({
                aci: registryWithEventsAci, address: this.contractAddress
            });

            console.log("initialized aeternity sdk");
        }
    };

    networkId = async () => {
        return (await this.client.getNodeInfo()).nodeNetworkId
    };

    getContractCreateByteCode = async (pollAddress) => {
        return this.cache.getOrSet(["getContractCreateByteCode", pollAddress], async () =>
                fetch(`${process.env.MIDDLEWARE_URL}/v2/txs?contract=${pollAddress}&type=contract_create`).then(res => res.json()).then(async res => res?.data[0]?.tx.code),
            this.cache.longCacheTime);
    };

    verifyPollContract = async (pollAddress) => {
        const result = async () => {
            try {
                const verifiedHashes = Object.values(byteCodeHashes).map(hashes => hashes["Poll.aes"]?.hash || hashes["Poll_Iris.aes"]?.hash).filter(hash => !!hash)
                //const contractCreateBytecode = await this.client.getContractByteCode(pollAddress).then(res => res.bytecode); can't be used as the returned bytecode is stripped from the init function and thus won't match the pre-generated hash
                const contractCreateBytecode = await this.getContractCreateByteCode(pollAddress);

                if (contractCreateBytecode) {
                    const pollBytecodeHash = crypto.createHash('sha256').update(contractCreateBytecode).digest('hex')
                    return verifiedHashes.includes(pollBytecodeHash)
                }
                return false
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
            return (await this.contract.created_height()).decodedResult
        });
    };

    iterateMdw = async (next) => {
        const result = await fetch(`${process.env.MIDDLEWARE_URL}${next}`).then(res => res.json());
        if (result.next) {
            return result.data.concat(await this.iterateMdw(result.next));
        }
        return result.data;
    }

    middlewareContractTransactions = (height) => {
        return this.iterateMdw(`/v2/txs?scope=gen:${height}-0&contract=${this.contractAddress}&type=contract_call&limit=100`);
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
        return this.cache.getOrSet(["polls"], async () => {
            const polls = (await this.contract.polls()).decodedResult
            const verifiedPolls = await Promise.all(Array.from(polls.entries())
                .map(([id, data]) => this.verifyPollContract(data.poll)
                    .then(verified => ([id, {...data, verified}]))
                    .catch(e => {
                        console.error("verifyPollContract", e);
                        return [id, {...data, verified: false}];
                    })));
            return verifiedPolls.filter(([_, data]) => data.verified);
        }, this.cache.shortCacheTime);
    };

    pollState = async (address) => {
        const pollAddress = address.replace("ak_", "ct_");
        const pollContract = this.pollContracts[pollAddress] ? this.pollContracts[pollAddress] : await this.client.initializeContract({
            aci: pollAci,
            address: pollAddress
        }).then(contract => {
            this.pollContracts[pollAddress] = contract;
            return contract;
        });

        const pollState = (await pollContract.get_state()).decodedResult;
        pollState.votes = Object.fromEntries(pollState.votes.entries());
        pollState.vote_options = Object.fromEntries(pollState.vote_options.entries());
        return pollState;
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
            return this.cache.getOrSet(["delegations", closingHeightOrUndefined], async () => {
                const delegations = (await this.contract.delegations()).decodedResult;
                return Array.from(delegations.entries());
            }, this.cache.shortCacheTime);
        }
    };

    tokenSupply = async (pollCloseHeight) => {
        const height = await this.height();
        const closingHeightOrUndefined = await this.getClosingHeightOrUndefined(pollCloseHeight);
        const closingHeightOrCurrentHeight = closingHeightOrUndefined ? closingHeightOrUndefined : height;

        return this.cache.getOrSet(["totalSupply", closingHeightOrCurrentHeight], async () => {
            const networkId = await this.networkId();
            return totalSupplyAtHeight(this.cache, networkId, closingHeightOrCurrentHeight);
        }, this.cache.longCacheTime);
    };

    height = async () => {
        return this.cache.getOrSet(["height"], () => this.client.getHeight(), this.cache.shortCacheTime);
    };

    transactionEvent = async ({hash, tx}) => {
        return this.cache.getOrSet(["transactionEvent", hash || tx.hash], async () => {
            process.stdout.write(",");
            const {height, nonce, log} = hash
                ? await this.client.api.getTransactionInfoByHash(hash).then(({callInfo}) => ({
                    height: callInfo.height,
                    nonce: callInfo.callerNonce,
                    log: callInfo.log
                }))
                : ({height: tx.block_height, nonce: tx.tx.nonce, log: tx.tx.log})
            if (log.length === 1) {
                const topics = ["AddPoll", "Delegation", "RevokeDelegation", "Vote", "RevokeVote"];
                const topic = topics.find(topic => util.hashTopic(topic) === util.topicHashFromResult(log));
                const decodedUsingContract = this.contract.$decodeEvents(log)[0].args

                switch (topic) {
                    case "AddPoll":
                        return {
                            topic: topic,
                            height: height,
                            nonce: nonce,
                            poll: decodedUsingContract[0],
                            seq_id: decodedUsingContract[1]
                        };
                    case "Delegation":
                        return {
                            topic: topic,
                            height: height,
                            nonce: nonce,
                            delegator: decodedUsingContract[0],
                            delegatee: decodedUsingContract[1],
                        };
                    case "RevokeDelegation":
                        return {
                            topic: topic,
                            height: height,
                            nonce: nonce,
                            delegator: decodedUsingContract[0],
                        };
                    case "Vote":
                        return {
                            topic: topic,
                            height: height,
                            nonce: nonce,
                            poll: decodedUsingContract[0],
                            voter: decodedUsingContract[1],
                            option: decodedUsingContract[2],
                        };
                    case "RevokeVote":
                        return {
                            topic: topic,
                            height: height,
                            nonce: nonce,
                            poll: decodedUsingContract[0],
                            voter: decodedUsingContract[1],
                        };

                    default:
                        return {topic: topic};
                }
            }
            return null;
        })
    };
};

