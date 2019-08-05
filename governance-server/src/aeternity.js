const fs = require('fs');
const Universal = require('@aeternity/aepp-sdk').Universal;
const BigNumber = require('bignumber.js');
const axios = require('axios');

const registryContractSource = fs.readFileSync(__dirname + "/../../governance-contracts/contracts/Registry.aes", "utf-8");
const pollContractSource = fs.readFileSync(__dirname + "/../../governance-contracts/contracts/Poll.aes", "utf-8");

const groupBy = (xs, key) => xs.reduce((acc, x) => Object.assign({}, acc, {
    [x[key]]: (acc[x[key]] || []).concat(x)
}), {});

const aeternity = {};

aeternity.nodeUrl = "http://localhost:3001/";
//aeternity.nodeUrl = "https://sdk-testnet.aepps.com/";

aeternity.cache = {};
aeternity.cache.delegations = [];
aeternity.cache.totalSupply = {};
aeternity.cache.getTotalSupply = (height) => aeternity.cache.totalSupply[(height / 100).toFixed()];
aeternity.cache.setTotalSupply = (height, totalSupply) => aeternity.cache.totalSupply = {...aeternity.cache.totalSupply, ...{[(height / 100).toFixed()]: totalSupply}};

aeternity.init = async () => {
    aeternity.client = await Universal({
        url: aeternity.nodeUrl,
        internalUrl: aeternity.nodeUrl,
        keypair: {
            publicKey: "ak_11111111111111111111111111111111273Yts",
            secretKey: ""
        },
        networkId: "ae_uat",
        compilerUrl: "http://localhost:3080"
    });

    aeternity.contract = await aeternity.client.getContractInstance(registryContractSource, {contractAddress: 'ct_HhrGPwPeAUPXaqSht7wsh2cuG4YV5MwWdewVD3SZA4EK7tgbP'})
    console.log("initialized aeternity sdk")
};

aeternity.pollsOverview = async () => {
    if (!aeternity.client) await aeternity.init();

    const polls = await aeternity.contract.methods.polls_overview();
    return polls.decodedResult;
};

aeternity.pollState = async (address) => {
    if (!aeternity.client) await aeternity.init();

    const pollContract = await aeternity.client.getContractInstance(pollContractSource, {contractAddress: address.replace("ak_", "ct_")});
    const pollState = await pollContract.methods.get_state();
    return pollState.decodedResult;
};

aeternity.delegators = async (address) => {
    if (!aeternity.client) await aeternity.init();

    if (aeternity.cache.delegations.length) {
       return aeternity.cache.delegations.filter(([_, delegatee]) => delegatee === address);
    }

    const delegators = await aeternity.contract.methods.delegators(address);
    return delegators.decodedResult;
};

aeternity.delegations = async () => {
    if (!aeternity.client) await aeternity.init();

    const delegations = (await aeternity.contract.methods.get_state()).decodedResult.delegations;
    aeternity.cache.delegations = delegations;
    return delegations;
};

aeternity.tokenSupply = async (height) => {
    var cache = aeternity.cache.getTotalSupply(height);
    if (cache) return cache;
    const result = await axios.get(`${aeternity.nodeUrl}v2/debug/token-supply/height/${height}`);
    const value = new BigNumber(result.data.total).toFixed();
    aeternity.cache.setTotalSupply(height, value);

    return value;
};

aeternity.pollDetails = async (pollOverviews) => {
    return Promise.all(pollOverviews.map(async ([id, data]) => {
        const pollState = await aeternity.pollState(data.address);
        return {
            id: id,
            data: data,
            state: pollState
        }
    }))
};

aeternity.pollStateAndVotingAccounts = async (address) => {
    var start = new Date().getTime();
    const pollState = await aeternity.pollState(address);
    console.log("pollState", new Date().getTime() - start, "ms");

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

aeternity.pollVotesState = async (address) => {

    const {pollState, votingAccounts, votingAccountList} = await aeternity.pollStateAndVotingAccounts(address);

    await aeternity.delegations();

    var start = new Date().getTime();
    const stakesAtHeight = await aeternity.stakesAtHeight(votingAccounts, pollState.close_height, votingAccountList);
    console.log("stakesAtHeight", new Date().getTime() - start, "ms");

    const totalStake = stakesAtHeight.map(vote => vote.stake).reduce((acc, cur) => acc.plus(cur), new BigNumber('0')).toFixed();
    const stakesForOption = aeternity.stakesForOption(pollState.vote_options, stakesAtHeight, totalStake);

    const height = await aeternity.client.height();
    const closingHeightOrCurrentHeight = pollState.close_height ? pollState.close_height <= height ? pollState.close_height : height : height;

    start = new Date().getTime();
    const tokenSupply = await aeternity.tokenSupply(closingHeightOrCurrentHeight);
    console.log("tokenSupply", new Date().getTime() - start, "ms");

    const percentOfTotalSupply = new BigNumber(totalStake).dividedBy(tokenSupply).multipliedBy(100).toFixed(4);
    return {
        pollState: pollState,
        stakesAtHeight: stakesAtHeight,
        stakesForOption: stakesForOption,
        totalStake: totalStake,
        percentOfTotalSupply: percentOfTotalSupply
    };
};

aeternity.balanceAtHeightOrZero = async (account, height) => {

    console.log("         balanceAtHeightOrZero", account, height);

    const heightOption = height ? {height: height} : {};

    return aeternity.client.balance(account, heightOption).catch(async (e) => {
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
};

aeternity.stakesAtHeight = async (votingAccounts, closeHeight, ignoreAccounts) => {
    const votingAccountStakes = [];
    for (let vote of votingAccounts) {
        const {votingPower, balance, delegatedPower, _, flattenedDelegationTree} = await aeternity.balancePlusVotingPower(vote.account, closeHeight, ignoreAccounts);
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

aeternity.stakesForOption = (voteOptions, votingAccountStakes, totalStake) => {
    const voteOptionsEmptyVotes = voteOptions.reduce((acc, [id, _]) => {
        return {...acc, ...{[id.toString()]: []}}
    }, {});

    const votesByOption = {...voteOptionsEmptyVotes, ...groupBy(votingAccountStakes, 'option')};
    const stakesForOption = Object.keys(votesByOption).reduce(function (acc, option) {
        const votes = votesByOption[option]
            .sort((a, b) => a.account.localeCompare(b.account))
            .sort((a, b) => a.height - b.height);

        const optionStake = votes.reduce((acc, vote) => { // sum up stakes using bignumber
            return acc.plus(new BigNumber(vote.stake))
        }, new BigNumber('0')).toFixed();

        // divide by total stake to get percentage of total
        const percentageOfTotal = new BigNumber(optionStake).dividedBy(totalStake).multipliedBy(100);
        const percentageOfTotalString = percentageOfTotal.isNaN() ? new BigNumber('0') : percentageOfTotal.toFixed(2);

        acc.push({option: option, optionStake: optionStake, percentageOfTotal: percentageOfTotalString, votes: votes}); // add stakes and votes for option to final result
        return acc;
    }, []);

    return stakesForOption;
};


aeternity.delegationTree = async (address, height, ignoreAccounts = []) => {
    if (!aeternity.client) await aeternity.init();

    const initialAddress = address;

    async function discoverDelegationChain(address) {

        var start = new Date().getTime();
        const delegators = await aeternity.delegators(address);
        console.log("      aeternity.delegators", new Date().getTime() - start, "ms");

        return delegators.reduce(async (promiseAcc, [delegator, _]) => {

            const ignoreAccount = delegator === initialAddress || ignoreAccounts.includes(delegator);
            const recursiveDelegations = ignoreAccount ? [] : await discoverDelegationChain(delegator);

            if (ignoreAccount) {
                return promiseAcc;
            } else {
                const delegatorBalance = await aeternity.balanceAtHeightOrZero(delegator, height);
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

aeternity.balancePlusVotingPower = async (address, height, ignoreAccounts = []) => {
    var start = new Date().getTime();

    const balance = await aeternity.balanceAtHeightOrZero(address, height);
    const {delegatedPower, delegationTree, flattenedDelegationTree} = await aeternity.delegatedPower(address, height, ignoreAccounts);

    console.log("   balancePlusVotingPower", new Date().getTime() - start, "ms");

    return {
        votingPower: new BigNumber(balance).plus(new BigNumber(delegatedPower)).toFixed(),
        balance: balance,
        delegatedPower: delegatedPower,
        delegationTree: delegationTree,
        flattenedDelegationTree: flattenedDelegationTree
    }
};

aeternity.delegatedPower = async (address, closeHeight, ignoreAccounts = []) => {

    await aeternity.delegations();

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

    const initialDelegationTree = await aeternity.delegationTree(address, closeHeight, ignoreAccounts);
    const {delegatedPower, flattenedDelegationTree} = sumDelegatedPower(initialDelegationTree);

    return {
        delegatedPower: delegatedPower.toFixed(),
        delegationTree: initialDelegationTree,
        flattenedDelegationTree: flattenedDelegationTree
    };
};

aeternity.delegatedPowerPoll = async (address, pollContract) => {
    const {votingAccountList} = await aeternity.pollStateAndVotingAccounts(pollContract);
    return aeternity.delegatedPower(address, null, votingAccountList)
};

module.exports = aeternity;
