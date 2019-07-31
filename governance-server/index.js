const aeternity = require("./src/aeternity");
const express = require('express');
const cors = require('cors');

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
    methods: [ 'GET', 'OPTIONS']
}));

app.get('/votesState/:address', errorHandler(async (req, res) => {
    if (!req.params.address) return res.sendStatus(400);
    const address = req.params.address;

    const data = await aeternity.pollVotesState(address);
    res.json(data)
}));

aeternity.init();
app.listen(3000);
