const express = require('express');
const cors = require('cors');

const aeternity = require("./src/aeternity");
const cache = require("./src/cache");
const logic = require("./src/logic");

const app = express();

const errorHandler = (f) => {
    return (req, res, next) => {
        try {
            f(req, res, next);
        } catch (e) {
            next(e);
        }
    }
};

app.use(cors({
    origin: '*',
    optionsSuccessStatus: 200,
    methods: ['GET', 'OPTIONS']
}));

app.get('/votesState/:address', errorHandler(async (req, res) => {
    if (!req.params.address) return res.sendStatus(400);
    const address = req.params.address;

    const start = new Date().getTime();
    const data = await logic.pollVotesState(address);

    if (new Date().getTime() - start > 10) console.log("\npollVotesState", address, new Date().getTime() - start, "ms");
    res.json(data)
}));

app.get('/delegatedPower/:address', errorHandler(async (req, res) => {
    if (!req.params.address) return res.sendStatus(400);
    const address = req.params.address;

    const start = new Date().getTime();
    const data = req.query.poll
        ? await logic.delegatedPowerPoll(address, req.query.poll)
        : await logic.delegatedPower(address);

    if (new Date().getTime() - start > 10) console.log("\ndelegatedPower", address, req.query.poll, new Date().getTime() - start, "ms");
    res.json(data)
}));

app.get('/pollOverview/:address', errorHandler(async (req, res) => {
    if (!req.params.address) return res.sendStatus(400);
    const address = req.params.address;

    const start = new Date().getTime();
    const data = await logic.cachedPollState(address);

    if (new Date().getTime() - start > 10) console.log("\npollOverview", address, new Date().getTime() - start, "ms");
    res.json(data)
}));

app.get('/accountPollVoterAuthor/:address', errorHandler(async (req, res) => {
    if (!req.params.address) return res.sendStatus(400);
    const address = req.params.address;

    const start = new Date().getTime();
    const data = await logic.accountPollVoterAuthor(address);

    if (new Date().getTime() - start > 10) console.log("\naccountPollVoterAuthor", address, new Date().getTime() - start, "ms");
    res.json(data)
}));

aeternity.init();
cache.startInvalidator(aeternity);
app.listen(3000);
