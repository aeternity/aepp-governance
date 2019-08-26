const BigNumber = require('bignumber.js');

const util = require('./util');
const cache = require('./cache');
const aeternity = require('./aeternity');

const logic = {};

logic.delegatedPowerPoll = async (address, pollContract) => {
    const {votingAccountList} = await logic.pollStateAndVotingAccounts(pollContract);
    return logic.delegatedPower(address, null, votingAccountList)
};

logic.pollOverview = async (address) => {
    const height = await aeternity.height();
    return cache.getOrSet(["pollOverview", address, height], () => logic.overviewPollVotesState(address, height), 120);
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

logic.overviewPollVotesState = async (address, height) => {
    const {pollState, votingAccounts, votingAccountList} = await logic.pollStateAndVotingAccounts(address);
    const stakesAtHeight = await logic.stakesAtHeight(votingAccounts, pollState.close_height, votingAccountList);
    const totalStake = stakesAtHeight.map(vote => vote.stake).reduce((acc, cur) => acc.plus(cur), new BigNumber('0')).toFixed();
    const closingHeightOrCurrentHeight = pollState.close_height ? pollState.close_height <= height ? pollState.close_height : height : height;
    const tokenSupply = await aeternity.tokenSupply(closingHeightOrCurrentHeight);
    const percentOfTotalSupply = new BigNumber(totalStake).dividedBy(tokenSupply).multipliedBy(100).toFixed();
    return {
        voteCount: votingAccounts.length,
        percentOfTotalSupply: percentOfTotalSupply
    }
};

logic.pollVotesState = async (address) => {
    const {pollState, votingAccounts, votingAccountList} = await logic.pollStateAndVotingAccounts(address);

    const height = await aeternity.height();
    const closingHeightOrUndefined = pollState.close_height ? pollState.close_height <= height ? pollState.close_height : undefined : undefined;
    await aeternity.delegations(closingHeightOrUndefined);

    const stakesAtHeight = await logic.stakesAtHeight(votingAccounts, pollState.close_height, votingAccountList);
    const totalStake = stakesAtHeight.map(vote => vote.stake).reduce((acc, cur) => acc.plus(cur), new BigNumber('0')).toFixed();
    const stakesForOption = logic.stakesForOption(pollState.vote_options, stakesAtHeight, totalStake);

    const closingHeightOrCurrentHeight = pollState.close_height ? pollState.close_height <= height ? pollState.close_height : height : height;
    const tokenSupply = await aeternity.tokenSupply(closingHeightOrCurrentHeight);

    const percentOfTotalSupply = new BigNumber(totalStake).dividedBy(tokenSupply).multipliedBy(100).toFixed();
    return {
        pollState: pollState,
        stakesAtHeight: stakesAtHeight,
        stakesForOption: stakesForOption,
        totalStake: totalStake,
        percentOfTotalSupply: percentOfTotalSupply
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
        return cache.getOrSet(["pollStateAndVotingAccounts", address], result, 120);
    } else {
        const data = await result();
        cache.set(["pollStateAndVotingAccounts", address], data, 120);
        return data;
    }
};

logic.stakesAtHeight = async (votingAccounts, closeHeight, ignoreAccounts) => {
    const votingAccountStakes = [];
    for (let vote of votingAccounts) {
        const {votingPower, balance, delegatedPower, _, flattenedDelegationTree} = await logic.balancePlusVotingPower(vote.account, closeHeight, ignoreAccounts);
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

    process.stdout.write(".");

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
        process.stdout.write(";");

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
    }, 120);
};

logic.delegationTree = async (address, height, ignoreAccounts = []) => {
    const initialAddress = address;

    async function discoverDelegationChain(address) {
        const delegators = await aeternity.delegators(address);

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
                    flattenedDelegationTree: [{delegator: delegator, balance: delegation.balance}]
                }
                : sumDelegatedPower(delegation.delegations);

            return {
                delegatedPower: delegatedPower.plus(new BigNumber(delegation.balance)).plus(recursionResult.delegatedPower),
                flattenedDelegationTree: flattenedDelegationTree.concat(recursionResult.flattenedDelegationTree)
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
