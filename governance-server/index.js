const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const Aeternity = require("./src/aeternity");
const Logic = require("./src/logic");
const cache = require("./src/cache");
logic = null;

const GIT_REV = null;

BigInt.prototype.toJSON = function () { return Number(this) }

const app = express();
app.use(bodyParser.json());
process.on('unhandledRejection', (reason, p) => console.log('Unhandled Rejection at: Promise', p, 'reason:', reason));

const init = async () => {
    const aeternity = new Aeternity();
    await aeternity.init();
    await cache.init(aeternity);
    logic = new Logic(aeternity);

    const port = process.env.PORT ? process.env.PORT : 3000;
    console.log("governance-server listening on port", port);
    app.listen(port);
};

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
    methods: ['GET', 'POST', 'OPTIONS']
}));

app.get('/votesState/:address', errorHandler(async (req, res) => {
    if (!req.params.address) return res.sendStatus(400);
    const address = req.params.address;

    const start = new Date().getTime();
    const data = await logic.pollVotesState(address);

    if (new Date().getTime() - start > 10) console.log("\nrequest pollVotesState", address, new Date().getTime() - start, "ms");
    res.json(data)
}));

app.get('/delegatedPower/:address', errorHandler(async (req, res) => {
    if (!req.params.address) return res.sendStatus(400);
    const address = req.params.address;

    const start = new Date().getTime();
    const data = req.query.poll
        ? await logic.delegatedPowerPoll(address, req.query.poll)
        : await logic.delegatedPower(address);

    if (new Date().getTime() - start > 10) console.log("\nrequest delegatedPower", address, req.query.poll, new Date().getTime() - start, "ms");
    res.json(data)
}));

app.get('/pollOverview/:address', errorHandler(async (req, res) => {
    if (!req.params.address) return res.sendStatus(400);
    const address = req.params.address;

    const start = new Date().getTime();
    const data = await logic.cachedPollState(address);

    if (new Date().getTime() - start > 10) console.log("\nrequest pollOverview", address, new Date().getTime() - start, "ms");
    res.json(data)
}));

app.get('/accountPollVoterAuthor/:address', errorHandler(async (req, res) => {
    if (!req.params.address) return res.sendStatus(400);
    const address = req.params.address;

    const start = new Date().getTime();
    const data = await logic.accountPollVoterAuthor(address);

    if (new Date().getTime() - start > 10) console.log("\nrequest accountPollVoterAuthor", address, new Date().getTime() - start, "ms");
    res.json(data)
}));

app.post('/contractEvent', errorHandler(async (req, res) => {
    if (!req.body || !req.body.topic) return res.sendStatus(400);
    const data = await cache.handleContractEvent(req.body);
    res.json(data)
}));

app.get('/pollOrdering', errorHandler(async (req, res) => {
    const start = new Date().getTime();
    const data = await logic.pollOrdering(req.query.closed === "true");
    if (new Date().getTime() - start > 10) console.log("\nrequest pollOrdering", new Date().getTime() - start, "ms");
    res.json(data)
}));

app.get('/version', (req, res) => {
    res.json({version: GIT_REV ? GIT_REV : "local"})
});

init();
