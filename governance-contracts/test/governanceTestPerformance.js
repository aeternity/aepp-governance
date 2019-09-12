/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

const Universal = require('@aeternity/aepp-sdk').Universal;


const registrySource = utils.readFileRelative('./contracts/Registry.aes', 'utf-8');
const pollSource = utils.readFileRelative('./contracts/Poll.aes', 'utf-8');
const Crypto = require('@aeternity/aepp-sdk').Crypto;

const config = {
    host: 'http://localhost:3001/',
    internalHost: 'http://localhost:3001/internal/',
    compilerUrl: 'http://localhost:3080'
};

const account_count = 10;
const seq_count = 2;

const additional_wallets = [];

describe.skip('Governance Contracts Performance', () => {

    let client, registryContract;

    before(async () => {
        client = await Universal({
            url: config.host,
            internalUrl: config.internalHost,
            keypair: {
                publicKey: "ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU",
                secretKey: "bb9f0b01c8c9553cfbaf7ef81a50f977b1326801ebf7294d1c2cbccdedf27476e9bbf604e611b5460a3b3999e9771b6f60417d73ce7c5519e12f7e127a1225ca"
            },
            nativeMode: true,
            networkId: 'ae_devnet',
            compilerUrl: config.compilerUrl
        });

        registryContract = await client.getContractInstance(registrySource, {contractAddress: 'ct_2dPo948JddJ75w3NmB9CaSDBe8te9x5oA1xb6t3x1c12TesBiT'});
        //await registryContract.methods.init().then(init => console.log(init.address));

        await [...Array(account_count).keys()].reduce(async (promiseAcc, id) => {
            await promiseAcc;
            const keypair = Crypto.generateKeyPair();
            additional_wallets.push(keypair);
            process.stdout.write(".");
            return client.spend(((Math.random() * 100) + 0.2) * 1000000000000000000, keypair.publicKey);
        }, Promise.resolve({}));

        console.log("funded", additional_wallets.length);
    });

    it('Add Lots of Polls to Registry', async () => {
        const height = await client.height();
        const createAndAddPoll = async (client) => {
            const pollContract = await client.getContractInstance(pollSource);

            const metadata = {
                title: "Testing " + Math.random().toString(36).substring(7),
                description: "This Poll is created for Testing purposes only",
                link: "https://aeternity.com/",
                spec_ref: Promise.resolve("d4f02eaafd1a9e9de7d10972ca8e47fa7a985825c3c9c1e249c72683cb3e4f19")
            };
            const vote_options = {0: "Yes, test more", 1: "No, test less", 2: "Who cares?"};
            const close_height = Math.round(Math.random()) ? Promise.reject() : Promise.resolve(height + Math.floor(Math.random() * 1000));

            const init = await pollContract.methods.init(metadata, vote_options, close_height);
            assert.equal(init.result.returnType, 'ok');

            const contract = await client.getContractInstance(registrySource, {contractAddress: registryContract.deployInfo.address});
            await contract.methods.add_poll(init.address, !!Math.round(Math.random())).catch(e => console.error(e.message));
            console.log("added poll");

            return true;
        };

        const createPolls = async (client) => {
            return await [...Array(seq_count).keys()].reduce(async (promiseAcc, _) => {
                await promiseAcc;
                return createAndAddPoll(client).catch(e => console.error(e.message));
            }, Promise.resolve({}));
        };

        await Promise.all(additional_wallets.map(async wallet => {
            const client = await Universal({
                url: config.host,
                internalUrl: config.internalHost,
                keypair: wallet,
                nativeMode: true,
                networkId: 'ae_devnet',
                compilerUrl: config.compilerUrl
            });

            const contract = await client.getContractInstance(registrySource, {contractAddress: registryContract.deployInfo.address});
            return createPolls(client, contract).catch(e => console.error(e.message));
        }));

        await new Promise(resolve => setTimeout(resolve, 5000));

        const start1 = new Date().getTime();
        await registryContract.methods.polls()
            .then(res => console.log("   Overview", res.decodedResult.length, new Date().getTime() - start1, "ms"));
    });

    it('Add Lots of Delegates and Votes to Poll', async () => {
        pollContract = await client.getContractInstance(pollSource);

        const metadata = {
            title: "Testing",
            description: "This Poll is created for Testing purposes only",
            link: "https://aeternity.com/"
        };
        const vote_options = {0: "Yes, test more", 1: "No, test less", 2: "Who cares?", 3: "WHAT", 4: "Maybe?!"};
        const close_height = Promise.reject();

        const init = await pollContract.methods.init(metadata, vote_options, close_height);
        await registryContract.methods.add_poll(init.address, true);

        await additional_wallets.reduce(async (promiseAcc, wallet) => {
            await promiseAcc;
            if (Math.floor(Math.random() * 1.5)) return Promise.resolve();

            const client = await Universal({
                url: config.host,
                internalUrl: config.internalHost,
                keypair: wallet,
                nativeMode: true,
                networkId: 'ae_devnet',
                compilerUrl: config.compilerUrl
            });

            process.stdout.write(".");

            const contract = await client.getContractInstance(pollSource, {contractAddress: init.address});
            return contract.methods.vote(Math.floor(Math.random() * 5)).catch(e => console.error(e.message));
        }, Promise.resolve({}));

        await additional_wallets.reduce(async (promiseAcc, wallet) => {
            if (Math.floor(Math.random() * 2.5)) return Promise.resolve();

            await promiseAcc;
            const client = await Universal({
                url: config.host,
                internalUrl: config.internalHost,
                keypair: wallet,
                nativeMode: true,
                networkId: 'ae_devnet',
                compilerUrl: config.compilerUrl
            });

            process.stdout.write(";");

            const contract = await client.getContractInstance(registrySource, {contractAddress: registryContract.deployInfo.address});
            return contract.methods.delegate(additional_wallets[Math.floor(Math.random() * account_count / 2)].publicKey).catch(e => console.error(e.message));
        }, Promise.resolve({}));


        const start1 = new Date().getTime();
        await registryContract.methods.polls()
            .then(res => console.log("   Overview", res.decodedResult.length, new Date().getTime() - start1, "ms"));

        const start2 = new Date().getTime();
        await pollContract.methods.get_state()
            .then(() => console.log("   GetState", new Date().getTime() - start2, "ms"));

    })
});
