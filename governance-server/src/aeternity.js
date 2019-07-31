const fs = require('fs');
const Universal = require('@aeternity/aepp-sdk').Universal;
const BigNumber = require('bignumber.js');

const registryContractSource = fs.readFileSync(__dirname + "/../../governance-contracts/contracts/Registry.aes", "utf-8");
const pollContractSource = fs.readFileSync(__dirname + "/../../governance-contracts/contracts/Poll.aes", "utf-8");

const groupBy = (xs, key) => xs.reduce((acc, x) => Object.assign({}, acc, {
    [x[key]]: (acc[x[key]] || []).concat(x)
}), {});

const aeternity = {};

const init = async () => {
    aeternity.client = await Universal({
        url: "https://sdk-testnet.aepps.com/",
        internalUrl: "https://sdk-testnet.aepps.com/",
        keypair: {
            publicKey: "ak_11111111111111111111111111111111273Yts",
            secretKey: ""
        },
        networkId: "ae_uat",
        compilerUrl: "https://compiler.aepps.com"
    });

    aeternity.contract = await aeternity.client.getContractInstance(registryContractSource, {contractAddress: 'ct_21AkKmq4JkQf9Mwu8kNcnFTpFGf5q7xDqToaUJ7hfph5bSZF6v'})
};

aeternity.pollsOverview = async () => {
    if (!aeternity.client) await init();

    const polls = await aeternity.contract.methods.polls_overview();
    return polls.decodedResult;
};

aeternity.pollState = async (address) => {
    if (!aeternity.client) await init();

    const pollContract = await aeternity.client.getContractInstance(pollContractSource, {contractAddress: address.replace("ak_", "ct_")});
    const pollState = await pollContract.methods.get_state();
    return pollState.decodedResult;
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

aeternity.pollVotesState = async (address) => {
    const pollState = await aeternity.pollState(address);
    console.log(pollState);

    const votingAccounts = pollState.votes.map(([account, option]) => {
        return {
            account: account,
            option: option
        };
    });

    const stakesAtHeight = await aeternity.stakesAtHeight(votingAccounts, pollState.close_height);
    const totalStake = stakesAtHeight.map(vote => vote.stake).reduce((acc, cur) => acc.plus(cur), new BigNumber('0')).toFixed();
    const stakesForOption = aeternity.stakesForOption(stakesAtHeight, totalStake);

    return {
        pollState: pollState,
        stakesAtHeight: stakesAtHeight,
        stakesForOption: stakesForOption,
        totalStake: totalStake
    };
};

aeternity.stakesAtHeight = async (votingAccounts, closeHeight) => {
    const votingAccountStakes = [];
    for (let vote of votingAccounts) {
        const closingHeightOptions = closeHeight ? {height: closeHeight} : {};
        const balanceAtHeight = await aeternity.client.balance(vote.account, closingHeightOptions).catch(async (e) => {
            if (e.message.includes("Height not available")) {
                // account balance will fail if not yet at closing height, use current height for a temporary result
                return await aeternity.client.balance(vote.account).catch((e) => {
                    console.error(e);
                    return '0'
                });
            } else {
                // account balance will fail if account didn't exist at closing height, so stake is 0
                return '0';
            }
        });
        votingAccountStakes.push({...vote, ...{stake: balanceAtHeight}}) // append stake to vote object
    }

    return votingAccountStakes;
};

aeternity.stakesForOption = (votingAccountStakes, totalStake) => {
    const votesByOption = groupBy(votingAccountStakes, 'option');
    const stakesForOption = Object.keys(votesByOption).reduce(function (acc, option) {
        const votes = votesByOption[option]
            .sort((a, b) => a.account.localeCompare(b.account))
            .sort((a, b) => a.height - b.height);

        const optionStake = votes.reduce((acc, vote) => { // sum up stakes using bignumber
            return acc.plus(new BigNumber(vote.stake))
        }, new BigNumber('0')).toFixed();

        // divide by total stake to get percentage of total
        const percentageOfTotal = new BigNumber(optionStake).dividedBy(totalStake).multipliedBy(100).toFixed(2);

        acc.push({option: option, optionStake: optionStake, percentageOfTotal: percentageOfTotal, votes: votes}); // add stakes and votes for option to final result
        return acc;
    }, []);

    return stakesForOption;
};

module.exports = aeternity;
