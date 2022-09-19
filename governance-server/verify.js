const util = require("./src/util");
const Aeternity = require("./src/aeternity");
const Logic = require("./src/logic");

const findPollAddress = (arg, polls) => {
    var poll = null;
    if (!isNaN(parseInt(arg))) {
        poll = polls.find(([id, _]) => id === parseInt(arg))
    } else {
        if (arg.startsWith("ct_")) {
            poll = polls.find(([_, data]) => data.poll === arg)
        } else {
            throw new Error("not a valid contract address passed");
        }
    }
    if (!poll) throw new Error("poll not found by id or address");
    return poll;
};

const verify = async () => {

    const verifyConstants = {
        nodeUrl: "https://mainnet.aeternity.io/",
        compilerUrl: "https://compiler.aepps.com",
        registryContract: "ct_ouZib4wT9cNwgRA1pxgA63XEUd8eQRrG8PcePDEYogBc1VYTq"
    };

    const aeternity = new Aeternity(verifyConstants);
    await aeternity.init();
    const height = await aeternity.height();
    const polls = await aeternity.polls();
    const logic = new Logic(aeternity, verifyConstants);

    const poll = findPollAddress(process.argv[process.argv.length - 1], polls);
    const pollAddress = poll[1].poll;
    const pollState = await logic.pollVotesState(pollAddress);

    console.log(`\nPoll #${poll[0]} ${pollAddress}`);
    height > pollState.pollState.close_height ? console.log(`Poll closed (Results final)`) : console.log(`Poll NOT closed (Results NOT final)`);
    console.log("Total Stake:", util.atomsToAe(pollState.totalStake).toFixed(2), "AE");
    console.log("Percentage of total supply:", parseFloat(pollState.percentOfTotalSupply).toFixed(2), "%");
    console.log("Number of votes:", pollState.voteCount);
    pollState.stakesForOption.forEach(option => {
        const optionName = pollState.pollState.vote_options[parseInt(option.option)][1];
        console.log("Votes for Option:", optionName, parseFloat(option.percentageOfTotal).toFixed(2), "%")
    });
};

verify().catch(e => console.error(e.message));
