const BigNumber = require('bignumber.js');

const util = require('./util');

module.exports = class Logic {
    aeternity;
    cache;

    constructor(aeternity, verifyConstants = null) {
        this.verifyConstants = verifyConstants;
        this.cache = this.verifyConstants ? require('./mock') : require('./cache');
        this.aeternity = aeternity;
    }

    delegatedPowerPoll = async (address, pollContract) => {
        const {votingAccountList} = await this.pollStateAndVotingAccounts(pollContract);
        return this.delegatedPower(address, null, votingAccountList)
    };

    cachedPollState = async (address) => {
        const height = await this.aeternity.height();
        return this.cache.getOrSet(["pollOverview", address, height], () => this.pollVotesState(address), this.cache.shortCacheTime);
    };

    pollOrdering = async (closed = false) => {
        const result = async () => {
            const considerCloseBlocks = 5000;

            const closeScoreWeight = 2;
            const stakeScoreWeight = 1;
            const votesScoreWeight = 0.5;
            const delegationsScoreWeight = 0.5;

            const height = await this.aeternity.height();
            const polls = (await this.aeternity.polls())
                .filter(poll => poll[1].is_listed)
                .filter(poll => {
                    if (closed) {
                        return poll[1].close_height && poll[1].close_height <= height;
                    } else {
                        return !poll[1].close_height || poll[1].close_height > height;
                    }
                });

            const pollsData = await polls.asyncMap(async ([id, data]) => {
                const state = await this.cachedPollState(data.poll);
                const verified = await this.aeternity.verifyPollContract(data.poll).catch(e => {
                    console.error("verifyPollContract", e);
                    return null
                });

                return {
                    id: id,
                    poll: data.poll,
                    verified: verified,
                    totalStake: state.totalStake,
                    voteCount: state.voteCount,
                    closeHeight: state.pollState.close_height ? state.pollState.close_height : null,
                    delegationCount: state.stakesAtHeight.reduce((acc, cur) => acc + cur.delegators.length, 0)
                }
            });

            const maxVotes = Math.max(...pollsData.map(poll => poll.voteCount), 1);
            const maxDelegations = Math.max(...pollsData.map(poll => poll.delegationCount), 1);
            const maxStake = BigNumber.max(...pollsData.map(poll => poll.totalStake), '1');

            const pollsScores = pollsData.map(poll => {
                const closesInBlocks = poll.closeHeight - height;
                const considerCloseHeight = poll.closeHeight ? closesInBlocks > 0 && closesInBlocks <= considerCloseBlocks ? closesInBlocks : null : null;
                poll.considerCloseHeight = considerCloseHeight;

                poll.closeScore = considerCloseHeight ? Math.abs(considerCloseBlocks - considerCloseHeight) / considerCloseBlocks : 0;
                poll.stakeScore = new BigNumber(poll.totalStake).dividedBy(maxStake).toNumber();
                poll.votesScore = poll.voteCount / maxVotes;
                poll.delegationsScore = poll.delegationCount / maxDelegations;

                poll.score = poll.closeScore * closeScoreWeight
                    + poll.stakeScore * stakeScoreWeight
                    + poll.votesScore * votesScoreWeight
                    + poll.delegationsScore * delegationsScoreWeight;

                return poll;
            });

            return {
                ordering: pollsScores.sort((a, b) => b.score - a.score).map(score => score.id),
                data: pollsScores
            };
        };

        return this.cache.getOrSet(["pollOrdering", closed], result, this.cache.shortCacheTime);
    };

    accountPollVoterAuthor = async (address) => {
        const polls = await this.aeternity.polls();

        return polls.reduce(async (promiseAcc, [id, data]) => {
            const acc = await promiseAcc;
            const {pollState, votingAccountList} = await this.pollStateAndVotingAccounts(data.poll, true);

            const getVoteForAccount = (account) => {
                const voteId = pollState.votes.find(([voter, _]) => voter === account)[1];
                const voteOption = pollState.vote_options.find(([id]) => id === voteId)[1];
                return {vote: voteOption};
            };

            if (pollState.author === address) acc.authorOfPolls.push([id, data]);
            if (votingAccountList.includes(address)) acc.votedInPolls.push([id, {...data, ...getVoteForAccount(address)}]);
            const closingHeightOrUndefined = await this.aeternity.getClosingHeightOrUndefined(pollState.close_height);
            const delegateePower = await this.delegatedPower(address, closingHeightOrUndefined, [], true);
            acc.delegateeVotes = [...acc.delegateeVotes, ...delegateePower.flattenedDelegationTree
                .filter(delegation => votingAccountList.includes(delegation.delegatee))
                .map(delegation => [id, {delegatee: delegation.delegatee, ...data, ...getVoteForAccount(delegation.delegatee)}])];
            return acc;
        }, Promise.resolve({votedInPolls: [], authorOfPolls: [], delegateeVotes: []}));
    };

    pollVotesState = async (address) => {
        const {pollState, votingAccounts, votingAccountList} = await this.pollStateAndVotingAccounts(address);
        await this.aeternity.delegations(pollState.close_height);

        const stakesAtHeight = await this.stakesAtHeight(votingAccounts, pollState.close_height, votingAccountList);
        const totalStake = stakesAtHeight.map(vote => vote.stake).reduce((acc, cur) => acc.plus(cur), new BigNumber('0')).toFixed();
        const stakesForOption = this.stakesForOption(pollState.vote_options, stakesAtHeight, totalStake);

        const tokenSupply = await this.aeternity.tokenSupply(pollState.close_height);

        const percentOfTotalSupply = new BigNumber(totalStake).dividedBy(tokenSupply).multipliedBy(100).toFixed();
        return {
            pollState: pollState,
            stakesAtHeight: stakesAtHeight,
            stakesForOption: stakesForOption,
            totalStake: totalStake,
            percentOfTotalSupply: percentOfTotalSupply,
            voteCount: votingAccounts.length,
        };
    };

    pollStateAndVotingAccounts = async (address, cached = false) => {
        const result = async () => {
            const pollState = await this.aeternity.pollState(address);

            const votingAccounts = pollState.votes.map(([account, option]) => {
                return {
                    account: account,
                    option: option
                };
            });
            const votingAccountList = votingAccounts.map(({account, _}) => account);

            return {
                pollState: pollState,
                votingAccounts: votingAccounts,
                votingAccountList: votingAccountList
            }
        };

        if (cached) {
            return this.cache.getOrSet(["pollStateAndVotingAccounts", address], result, this.cache.shortCacheTime);
        } else {
            const data = await result();
            this.cache.set(["pollStateAndVotingAccounts", address], data, this.cache.shortCacheTime);
            return data;
        }
    };

    stakesAtHeight = async (votingAccounts, pollCloseHeight, ignoreAccounts) => {
        const closingHeightOrUndefined = await this.aeternity.getClosingHeightOrUndefined(pollCloseHeight);
        const votingAccountStakes = [];
        for (let vote of votingAccounts) {
            const {votingPower, balance, delegatedPower, delegationTree, flattenedDelegationTree} = await this.balancePlusVotingPower(vote.account, closingHeightOrUndefined, ignoreAccounts);
            votingAccountStakes.push({
                ...vote, ...{
                    stake: votingPower,
                    balance: balance,
                    delegated: delegatedPower,
                    delegators: flattenedDelegationTree,
                    delegationTree: delegationTree
                }
            }) // append stake to vote object
        }
        return votingAccountStakes;
    };

    stakesForOption = (voteOptions, votingAccountStakes, totalStake) => {
        const voteOptionsEmptyVotes = voteOptions.reduce((acc, [id, _]) => {
            return {...acc, ...{[id.toString()]: []}}
        }, {});

        const votesByOption = {...voteOptionsEmptyVotes, ...util.groupBy(votingAccountStakes, 'option')};
        const stakesForOption = Object.keys(votesByOption).reduce(function (acc, option) {
            const votes = votesByOption[option]
                .sort((a, b) => a.account.localeCompare(b.account))
                .sort((a, b) => a.height - b.height);

            const optionStake = votes.reduce((acc, vote) => { // sum up stakes using bignumber
                return acc.plus(new BigNumber(vote.stake))
            }, new BigNumber('0')).toFixed();

            // divide by total stake to get percentage of total
            const percentageOfTotal = new BigNumber(optionStake).dividedBy(totalStake).multipliedBy(100);
            const percentageOfTotalString = percentageOfTotal.isNaN() ? new BigNumber('0') : percentageOfTotal.toFixed();

            acc.push({
                option: option,
                optionStake: optionStake,
                percentageOfTotal: percentageOfTotalString,
                votes: votes
            }); // add stakes and votes for option to final result
            return acc;
        }, []);

        return stakesForOption;
    };

    balancePlusVotingPower = async (address, height, ignoreAccounts = []) => {
        const balance = await this.balanceAtHeight(address, height);
        const {delegatedPower, delegationTree, flattenedDelegationTree} = await this.delegatedPower(address, height, ignoreAccounts);

        process.stdout.write("/");

        return {
            votingPower: new BigNumber(balance).plus(new BigNumber(delegatedPower)).toFixed(),
            balance: balance,
            delegatedPower: delegatedPower,
            delegationTree: delegationTree,
            flattenedDelegationTree: flattenedDelegationTree
        }
    };

    balanceAtHeight = async (account, height) => {
        return this.cache.getOrSet(["balanceAtHeight", height, account], async () => {
            const heightOption = height ? {height: height} : {};
            process.stdout.write("+");

            const balance = await this.aeternity.client.balance(account, heightOption).catch(async (e) => {
                if (e.message.includes("Height not available")) {
                    // account balance will fail if not yet at closing height, use current height for a temporary result
                    return await this.aeternity.client.balance(account).catch((e) => {
                        console.error(e);
                        return '0'
                    });
                } else {
                    // account balance will fail if account didn't exist at closing height, so stake is 0
                    return '0';
                }
            });

            return balance;
        }, this.cache.shortCacheTime);
    };

    /**
     * Creates delegation tree upwards by looking who delegated to a certain account at a certain height.
     * @param address
     * @param height
     * @param ignoreAccounts
     * @param searchDelegatee
     * @returns {Promise<*>}
     */
    delegationTree = async (address, height, ignoreAccounts = [], searchDelegatee) => {
        const initialAddress = address;
        const aeternity = this.aeternity;
        const balanceAtHeight = this.balanceAtHeight;

        async function discoverDelegationChain(address) {
            const nextLayerAccounts = searchDelegatee ? await aeternity.delegatee(address, height) : await aeternity.delegators(address, height);
            return nextLayerAccounts.reduce(async (promiseAcc, [delegator, delegatee]) => {
                const nextAccount = searchDelegatee ? delegatee : delegator;
                const ignoreAccount = nextAccount === initialAddress || ignoreAccounts.includes(nextAccount);
                const recursiveDelegations = ignoreAccount ? [] : await discoverDelegationChain(nextAccount);

                if (ignoreAccount) {
                    return promiseAcc;
                } else {
                    const delegatorBalance = await balanceAtHeight(nextAccount, height);
                    return {
                        ...(await promiseAcc), ...{
                            [nextAccount]: {
                                delegations: recursiveDelegations,
                                balance: delegatorBalance
                            }
                        }
                    };
                }
            }, Promise.resolve({}));
        }

        return discoverDelegationChain(address);
    };

    delegatedPower = async (address, closeHeight, ignoreAccounts = [], searchDelegatee = false) => {
        function sumDelegatedPower(delegationTree) {
            return Object.keys(delegationTree).reduce(({delegatedPower, flattenedDelegationTree}, delegator) => {
                const delegation = delegationTree[delegator];

                const recursionResult = Object.keys(delegation.delegations).length === 0
                    ? {
                        delegatedPower: new BigNumber('0'),
                        flattenedDelegationTree: []
                    }
                    : sumDelegatedPower(delegation.delegations);

                return {
                    delegatedPower: delegatedPower.plus(new BigNumber(delegation.balance)).plus(recursionResult.delegatedPower),
                    flattenedDelegationTree: flattenedDelegationTree
                        .concat([{
                            [searchDelegatee ? "delegatee" : "delegator"]: delegator,
                            balance: delegation.balance
                        }])
                        .concat(recursionResult.flattenedDelegationTree)
                }
            }, {delegatedPower: new BigNumber('0'), flattenedDelegationTree: []})
        }

        const initialDelegationTree = await this.delegationTree(address, closeHeight, ignoreAccounts, searchDelegatee);
        const {delegatedPower, flattenedDelegationTree} = sumDelegatedPower(initialDelegationTree);

        return {
            delegatedPower: delegatedPower.toFixed(),
            delegationTree: initialDelegationTree,
            flattenedDelegationTree: flattenedDelegationTree
        };
    };
};
