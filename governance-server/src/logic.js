const BigNumber = require('bignumber.js');

const util = require('./util');
const cache = require('./cache');
const aeternity = require('./aeternity');

const logic = {};

logic.delegatedPowerPoll = async (address, pollContract) => {
    const {votingAccountList} = await logic.pollStateAndVotingAccounts(pollContract);
    return logic.delegatedPower(address, null, votingAccountList)
};

logic.cachedPollState = async (address) => {
    const height = await aeternity.height();
    return cache.getOrSet(["pollOverview", address, height], () => logic.pollVotesState(address), cache.shortCacheTime);
};

logic.pollOrdering = async () => {
    const result = async () => {
        const considerCloseBlocks = 5000;

        const closeScoreWeight = 2;
        const stakeScoreWeight = 1;
        const votesScoreWeight = 0.5;
        const delegationsScoreWeight = 0.5;

        const polls = await aeternity.polls();
        const height = await aeternity.height();
        const pollsData = await polls.asyncMap(async ([id, data]) => {
            const state = await logic.cachedPollState(data.poll);

            return {
                id: id,
                poll: data.poll,
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
            const considerCloseHeight = poll.closeHeight ? closesInBlocks > 0 ? closesInBlocks : null : null;
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

    return cache.getOrSet(["pollOrdering"], result, cache.shortCacheTime);
};

logic.accountPollVoterAuthor = async (address) => {
    const polls = await aeternity.polls();

    return polls.reduce(async (promiseAcc, [id, data]) => {
        const acc = await promiseAcc;
        const {pollState, votingAccountList} = await logic.pollStateAndVotingAccounts(data.poll, true);

        if (pollState.author === address) acc.authorOfPolls.push([id, data]);
        if (votingAccountList.includes(address)) acc.votedInPolls.push([id, data]);

        return acc;
    }, Promise.resolve({votedInPolls: [], authorOfPolls: []}));
};

logic.pollVotesState = async (address) => {
    const {pollState, votingAccounts, votingAccountList} = await logic.pollStateAndVotingAccounts(address);
    await aeternity.delegations(pollState.close_height);

    const stakesAtHeight = await logic.stakesAtHeight(votingAccounts, pollState.close_height, votingAccountList);
    const totalStake = stakesAtHeight.map(vote => vote.stake).reduce((acc, cur) => acc.plus(cur), new BigNumber('0')).toFixed();
    const stakesForOption = logic.stakesForOption(pollState.vote_options, stakesAtHeight, totalStake);

    const tokenSupply = await aeternity.tokenSupply(pollState.close_height);

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

logic.pollStateAndVotingAccounts = async (address, cached = false) => {
    const result = async () => {
        const pollState = await aeternity.pollState(address);

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
        return cache.getOrSet(["pollStateAndVotingAccounts", address], result, cache.shortCacheTime);
    } else {
        const data = await result();
        cache.set(["pollStateAndVotingAccounts", address], data, cache.shortCacheTime);
        return data;
    }
};

logic.stakesAtHeight = async (votingAccounts, pollCloseHeight, ignoreAccounts) => {
    const closingHeightOrUndefined = await aeternity.getClosingHeightOrUndefined(pollCloseHeight);
    const votingAccountStakes = [];
    for (let vote of votingAccounts) {
        const {votingPower, balance, delegatedPower, _, flattenedDelegationTree} = await logic.balancePlusVotingPower(vote.account, closingHeightOrUndefined, ignoreAccounts);
        votingAccountStakes.push({
            ...vote, ...{
                stake: votingPower,
                balance: balance,
                delegated: delegatedPower,
                delegators: flattenedDelegationTree
            }
        }) // append stake to vote object
    }
    return votingAccountStakes;
};

logic.stakesForOption = (voteOptions, votingAccountStakes, totalStake) => {
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

        acc.push({option: option, optionStake: optionStake, percentageOfTotal: percentageOfTotalString, votes: votes}); // add stakes and votes for option to final result
        return acc;
    }, []);

    return stakesForOption;
};

logic.balancePlusVotingPower = async (address, height, ignoreAccounts = []) => {
    const balance = await logic.balanceAtHeight(address, height);
    const {delegatedPower, delegationTree, flattenedDelegationTree} = await logic.delegatedPower(address, height, ignoreAccounts);

    process.stdout.write("/");

    return {
        votingPower: new BigNumber(balance).plus(new BigNumber(delegatedPower)).toFixed(),
        balance: balance,
        delegatedPower: delegatedPower,
        delegationTree: delegationTree,
        flattenedDelegationTree: flattenedDelegationTree
    }
};

logic.balanceAtHeight = async (account, height) => {
    return cache.getOrSet(["balanceAtHeight", height, account], async () => {
        const heightOption = height ? {height: height} : {};
        process.stdout.write("+");

        const balance = await aeternity.client.balance(account, heightOption).catch(async (e) => {
            if (e.message.includes("Height not available")) {
                // account balance will fail if not yet at closing height, use current height for a temporary result
                return await aeternity.client.balance(account).catch((e) => {
                    console.error(e);
                    return '0'
                });
            } else {
                // account balance will fail if account didn't exist at closing height, so stake is 0
                return '0';
            }
        });

        return balance;
    }, cache.shortCacheTime);
};

logic.delegationTree = async (address, height, ignoreAccounts = []) => {
    const initialAddress = address;

    async function discoverDelegationChain(address) {
        const delegators = await aeternity.delegators(address, height);

        return delegators.reduce(async (promiseAcc, [delegator, _]) => {
            const ignoreAccount = delegator === initialAddress || ignoreAccounts.includes(delegator);
            const recursiveDelegations = ignoreAccount ? [] : await discoverDelegationChain(delegator);

            if (ignoreAccount) {
                return promiseAcc;
            } else {
                const delegatorBalance = await logic.balanceAtHeight(delegator, height);
                return {
                    ...(await promiseAcc), ...{
                        [delegator]: {
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

logic.delegatedPower = async (address, closeHeight, ignoreAccounts = []) => {
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
                    .concat([{delegator: delegator, balance: delegation.balance}])
                    .concat(recursionResult.flattenedDelegationTree)
            }
        }, {delegatedPower: new BigNumber('0'), flattenedDelegationTree: []})
    }

    const initialDelegationTree = await logic.delegationTree(address, closeHeight, ignoreAccounts);
    const {delegatedPower, flattenedDelegationTree} = sumDelegatedPower(initialDelegationTree);

    return {
        delegatedPower: delegatedPower.toFixed(),
        delegationTree: initialDelegationTree,
        flattenedDelegationTree: flattenedDelegationTree
    };
};

module.exports = logic;
