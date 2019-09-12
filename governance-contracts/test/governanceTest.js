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

import {encodeBase58Check, encodeUnsigned, hash} from "@aeternity/aepp-sdk/es/utils/crypto";

const Universal = require('@aeternity/aepp-sdk').Universal;
const Bytes = require('@aeternity/aepp-sdk/es/utils/bytes');
const Crypto = require('@aeternity/aepp-sdk').Crypto;
const blake2b = require('blake2b');
const BN = require('bn.js');


const registrySource = utils.readFileRelative('./contracts/Registry.aes', 'utf-8');
const pollSource = utils.readFileRelative('./contracts/Poll.aes', 'utf-8');

const config = {
    host: 'http://localhost:3001/',
    internalHost: 'http://localhost:3001/internal/',
    compilerUrl: 'http://localhost:3080'
};

describe('Governance Contracts', () => {

    let ownerKeypair, ownerClient, secondKeypair, secondClient, thirdKeypair;
    let registryContract, pollContract;

    before(async () => {
        ownerKeypair = wallets[0];
        secondKeypair = wallets[1];
        thirdKeypair = wallets[2];
        ownerClient = await Universal({
            url: config.host,
            internalUrl: config.internalHost,
            keypair: ownerKeypair,
            nativeMode: true,
            networkId: 'ae_devnet',
            compilerUrl: config.compilerUrl
        });

        secondClient = await Universal({
            url: config.host,
            internalUrl: config.internalHost,
            keypair: secondKeypair,
            nativeMode: true,
            networkId: 'ae_devnet',
            compilerUrl: config.compilerUrl
        });
    });

    const hashTopic = topic => blake2b(32).update(Buffer.from(topic)).digest('hex');
    const topicHashFromResult = result => Bytes.toBytes(result.result.log[0].topics[0], true).toString('hex');

    const eventArgument = (result, index) => result.result.log[0].topics[index + 1];
    const encodeEventAddress = (result, index, prefix) => `${prefix}${Crypto.encodeBase58Check(new BN(result.result.log[0].topics[index + 1]).toBuffer('be', 32))}`;

    it('Deploying Governance', async () => {
        registryContract = await ownerClient.getContractInstance(registrySource);
        const init = await registryContract.methods.init();
        assert.equal(init.result.returnType, 'ok');
    });

    it('Add Poll', async () => {
        pollContract = await ownerClient.getContractInstance(pollSource);
        const vote_options = {0: "Yes, test more", 1: "No, test less", 2: "Who cares?"};
        const close_height = Promise.reject();

        const metadata1 = {
            title: "Lorem ipsum dolor sit amet, consectetur adipiscing.",
            description: "This Poll is created for Testing purposes only",
            link: "https://aeternity.com/",
            spec_ref: Promise.resolve("d4f02eaafd1a9e9de7d10972ca8e47fa7a985825c3c9c1e249c72683cb3e4f19")
        };

        const init1 = await pollContract.methods.init(metadata1, vote_options, close_height).catch(e => e);
        assert.include(init1.decodedError, 'TITLE_STRING_TO_LONG');

        const metadata2 = {
            title: "Test",
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla pretium volutpat enim, in feugiat mi congue feugiat. Nam gravida efficitur convallis. Suspendisse congue tellus nulla, eu finibus nunc egestas sed. Cras luctus mauris iaculis fermentum posuere. Sed ut urna sit amet lorem commodo gravida..",
            link: "https://aeternity.com/",
            spec_ref: Promise.resolve("d4f02eaafd1a9e9de7d10972ca8e47fa7a985825c3c9c1e249c72683cb3e4f19")
        };

        const init2 = await pollContract.methods.init(metadata2, vote_options, close_height).catch(e => e);
        assert.include(init2.decodedError, 'DESCRIPTION_STRING_TO_LONG');


        const metadata = {
            title: "Testing",
            description: "This Poll is created for Testing purposes only",
            link: "https://aeternity.com/",
            spec_ref: Promise.resolve("d4f02eaafd1a9e9de7d10972ca8e47fa7a985825c3c9c1e249c72683cb3e4f19")
        };

        const init = await pollContract.methods.init(metadata, vote_options, close_height);
        assert.equal(init.result.returnType, 'ok');

        let addPoll = await registryContract.methods.add_poll(init.address, true);
        assert.equal(topicHashFromResult(addPoll), hashTopic('AddPoll'));
        assert.equal(encodeEventAddress(addPoll, 0, "ct_"), init.address);
        assert.equal(eventArgument(addPoll, 1), addPoll.decodedResult);
        assert.equal(addPoll.decodedResult, 0);
    });

    it('Get Polls', async () => {
        const polls = await registryContract.methods.polls();
        assert.equal(polls.decodedResult[0][1].title, 'Testing');
        assert.equal(polls.decodedResult[0][1].is_listed, true);
        assert.equal(polls.decodedResult[0][1].poll, pollContract.deployInfo.address);
        assert.equal(polls.decodedResult[0][1].close_height, undefined);
    });

    it('Get Poll', async () => {
        const polls = await registryContract.methods.polls();
        pollContract = await ownerClient.getContractInstance(pollSource, {contractAddress: polls.decodedResult[0][1].poll});
        let pollState = await pollContract.methods.get_state();
        assert.equal(pollState.decodedResult.metadata.title, 'Testing');
        assert.equal(pollState.decodedResult.close_height, undefined);
        assert.equal(pollState.decodedResult.author, ownerKeypair.publicKey);
        assert.deepEqual(pollState.decodedResult.vote_options, [[0, 'Yes, test more'], [1, 'No, test less'], [2, 'Who cares?']]);

        let title = await pollContract.methods.title();
        assert.equal(title.decodedResult, 'Testing');

        let metadata = await pollContract.methods.metadata();
        assert.deepEqual(metadata.decodedResult, {
            description: 'This Poll is created for Testing purposes only',
            link: 'https://aeternity.com/',
            title: 'Testing',
            spec_ref: "d4f02eaafd1a9e9de7d10972ca8e47fa7a985825c3c9c1e249c72683cb3e4f19"
        });

        let votes = await pollContract.methods.votes();
        assert.deepEqual(votes.decodedResult, []);
    });

    it('Add Vote', async () => {
        pollContract = await ownerClient.getContractInstance(pollSource, {contractAddress: pollContract.deployInfo.address});
        let vote = await pollContract.methods.vote(2);
        assert.equal(topicHashFromResult(vote), hashTopic('Vote'));
        assert.equal(encodeEventAddress(vote, 0, "ct_"), pollContract.deployInfo.address);
        assert.equal(encodeEventAddress(vote, 1, "ak_"), ownerKeypair.publicKey);
        assert.equal(eventArgument(vote, 2), 2);
        assert.equal(vote.result.returnType, 'ok');

        let pollState = await pollContract.methods.get_state();
        assert.deepEqual(pollState.decodedResult.votes, [['ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk', 2]]);
    });

    it('Add Vote; Failing, poll already closed', async () => {
        const otherPollContract = await secondClient.getContractInstance(pollSource);

        const metadata = {
            title: "Testing",
            description: "This Poll is created for Testing purposes only",
            link: "https://aeternity.com/",
            spec_ref: Promise.resolve("d4f02eaafd1a9e9de7d10972ca8e47fa7a985825c3c9c1e249c72683cb3e4f19")
        };
        const vote_options = {0: "Only Option"};
        const close_height = Promise.resolve(await ownerClient.height());

        const init = await otherPollContract.methods.init(metadata, vote_options, close_height);
        assert.equal(init.result.returnType, 'ok');

        let voteError = await otherPollContract.methods.vote(0).catch(e => e);
        assert.include(voteError.decodedError, 'POLL_ALREADY_CLOSED');
    });

    it('Revoke Vote', async () => {
        let revokeVote = await pollContract.methods.revoke_vote();
        assert.equal(topicHashFromResult(revokeVote), hashTopic('RevokeVote'));
        assert.equal(encodeEventAddress(revokeVote, 0, "ct_"), pollContract.deployInfo.address);
        assert.equal(encodeEventAddress(revokeVote, 1, "ak_"), ownerKeypair.publicKey);
        assert.equal(revokeVote.result.returnType, 'ok');

        let pollState = await pollContract.methods.get_state();
        assert.deepEqual(pollState.decodedResult.votes, []);
    });

    it('Add Vote; Failing, option not known', async () => {
        pollContract = await ownerClient.getContractInstance(pollSource, {contractAddress: pollContract.deployInfo.address});
        let voteError = await pollContract.methods.vote(3).catch(e => e);
        assert.include(voteError.decodedError, 'VOTE_OPTION_NOT_KNOWN');
    });

    it('Add Delegation', async () => {
        let addDelegation1 = await registryContract.methods.delegate(secondKeypair.publicKey);
        assert.equal(topicHashFromResult(addDelegation1), hashTopic('Delegation'));
        assert.equal(encodeEventAddress(addDelegation1, 0, "ak_"), ownerKeypair.publicKey);
        assert.equal(encodeEventAddress(addDelegation1, 1, "ak_"), secondKeypair.publicKey);

        assert.equal(addDelegation1.result.returnType, 'ok');

        let addDelegationError = await registryContract.methods.delegate(ownerKeypair.publicKey).catch(e => e);
        assert.include(addDelegationError.decodedError, 'CALLER_IS_DELEGATEE_DISALLOWED');

        let delegations = await registryContract.methods.delegations();
        assert.deepEqual(delegations.decodedResult, [[ownerKeypair.publicKey, secondKeypair.publicKey]]);

        let delegationsFrom = await registryContract.methods.delegatee(ownerKeypair.publicKey);
        assert.equal(delegationsFrom.decodedResult, secondKeypair.publicKey);

        let delegationsFor1 = await registryContract.methods.delegators(ownerKeypair.publicKey, []);
        assert.deepEqual(delegationsFor1.decodedResult, []);

        let delegationsFor2 = await registryContract.methods.delegators(secondKeypair.publicKey, []);
        assert.deepEqual(delegationsFor2.decodedResult, [[ownerKeypair.publicKey, secondKeypair.publicKey]]);
    });

    it('Revoke Delegation', async () => {
        let revokeDelegation = await registryContract.methods.revoke_delegation();
        assert.equal(topicHashFromResult(revokeDelegation), hashTopic('RevokeDelegation'));
        assert.equal(encodeEventAddress(revokeDelegation, 0, "ak_"), ownerKeypair.publicKey);
        assert.equal(revokeDelegation.result.returnType, 'ok');

        let delegations = await registryContract.methods.delegations();
        assert.deepEqual(delegations.decodedResult, []);
    });

    it('Get Delegators', async () => {
        let addDelegation1 = await registryContract.methods.delegate(thirdKeypair.publicKey);
        assert.equal(addDelegation1.result.returnType, 'ok');

        const secondClientRegistryContract = await secondClient.getContractInstance(registrySource, {contractAddress: registryContract.deployInfo.address});
        let addDelegation2 = await secondClientRegistryContract.methods.delegate(thirdKeypair.publicKey);
        assert.equal(addDelegation2.result.returnType, 'ok');

        let delegationsFor = await registryContract.methods.delegators(thirdKeypair.publicKey, []);
        assert.deepEqual(delegationsFor.decodedResult, [[ownerKeypair.publicKey, thirdKeypair.publicKey], [secondKeypair.publicKey, thirdKeypair.publicKey]]);

        let revokeDelegation1 = await registryContract.methods.revoke_delegation();
        assert.equal(revokeDelegation1.result.returnType, 'ok');

        let revokeDelegation2 = await secondClientRegistryContract.methods.revoke_delegation();
        assert.equal(revokeDelegation2.result.returnType, 'ok');
    });
});
