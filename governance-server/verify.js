const util = require("./src/util");
const Aeternity = require("./src/aeternity");
const Logic = require("./src/logic");

const pollAddress = process.argv[process.argv.length - 1];

const verify = async () => {

    const verifyConstants = {
        nodeUrl: "http://localhost:3013/",
        compilerUrl: "http://localhost:3080",
        registryContract: "ct_2uwZSiKc9vz1Rcg4Pr6FGnMY4R2rEpadWJNG64iAykJpGC9qGe"
    };

    const aeternity = new Aeternity(verifyConstants);
    await aeternity.init();
    const logic = new Logic(aeternity, verifyConstants);

    const pollState = await logic.pollVotesState(pollAddress);
    console.log(JSON.stringify(pollState, null, 2), "\n", "\n");

    console.log("Total Stake:", util.atomsToAe(pollState.totalStake).toFixed(2), "AE");
    console.log("Percentage of total supply:", parseFloat(pollState.percentOfTotalSupply).toFixed(2), "%");
    console.log("Number of votes:", pollState.voteCount);
    pollState.stakesForOption.forEach(option => {
        const optionName = pollState.pollState.vote_options[parseInt(option.option)][1];
        console.log("Votes for Option:", optionName, parseFloat(option.percentageOfTotal).toFixed(2), "%")
    });
};

verify();
