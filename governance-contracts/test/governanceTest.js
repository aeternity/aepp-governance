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

const config = {
    host: 'http://localhost:3001/',
    internalHost: 'http://localhost:3001/internal/',
    compilerUrl: 'http://localhost:3080'
};

describe('Governance Contracts', () => {

    let ownerClient, otherClient, otherKeypair, ownerKeypair, registryContract, pollContract;

    before(async () => {
        ownerKeypair = wallets[0];
        otherKeypair = wallets[1];
        ownerClient = await Universal({
            url: config.host,
            internalUrl: config.internalHost,
            keypair: ownerKeypair,
            nativeMode: true,
            networkId: 'ae_devnet',
            compilerUrl: config.compilerUrl
        });

        otherClient = await Universal({
            url: config.host,
            internalUrl: config.internalHost,
            keypair: otherKeypair,
            nativeMode: true,
            networkId: 'ae_devnet',
            compilerUrl: config.compilerUrl
        });
    });

    it('Deploying Governance', async () => {
        registryContract = await ownerClient.getContractInstance(registrySource);
        const init = await registryContract.methods.init();
        assert.equal(init.result.returnType, 'ok');
    });

    it('Add Poll', async () => {
        pollContract = await ownerClient.getContractInstance(pollSource);

        const metadata = {
            title: "Testing",
            description: "This Poll is created for Testing purposes only",
            link: "https://aeternity.com/",
            is_listed: true
        };
        const vote_options = {0: "Yes, test more", 1: "No, test less", 2: "Who cares?"};
        const close_height = Promise.reject();

        const init = await pollContract.methods.init(metadata, vote_options, close_height);
        assert.equal(init.result.returnType, 'ok');

        let addPoll = await registryContract.methods.add_poll(init.address);
        assert.equal(addPoll.decodedResult, 0);
    });

    it('Polls Overview', async () => {
        let pollsOverview = await registryContract.methods.polls_overview();
        assert.lengthOf(pollsOverview.decodedResult, 1);
        assert.deepEqual(pollsOverview.decodedResult[0], [0, {
            address: pollContract.deployInfo.address.replace("ct_", "ak_"),
            close_height: "None", //TODO will this be fixed in SDK?
            is_listed: true,
            title: "Testing",
            votes_count: 0
        }]);
    });

    it('Get Poll', async () => {
        let pollsOverview = await registryContract.methods.polls_overview();
        let address = pollsOverview.decodedResult[0][1].address.replace("ak_", "ct_");
        pollContract = await ownerClient.getContractInstance(pollSource, {contractAddress: address});
        let pollState = await pollContract.methods.get_state();
        assert.deepEqual(pollState.decodedResult, {
            close_height: undefined,
            metadata: {
                description: 'This Poll is created for Testing purposes only',
                is_listed: true,
                link: 'https://aeternity.com/',
                title: 'Testing'
            },
            vote_options: [[0, 'Yes, test more'], [1, 'No, test less'], [2, 'Who cares?']],
            votes: [],
            author: ownerKeypair.publicKey
        });
    });

    it('Add Vote', async () => {
        pollContract = await ownerClient.getContractInstance(pollSource, {contractAddress: pollContract.deployInfo.address});
        let vote = await pollContract.methods.vote(2);
        assert.equal(vote.result.returnType, 'ok');

        let pollState = await pollContract.methods.get_state();
        assert.deepEqual(pollState.decodedResult.votes, [['ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk', 2]]);
    });

    it('Add Vote; Failing, poll already closed', async () => {
        const otherPollContract = await otherClient.getContractInstance(pollSource);

        const metadata = {
            title: "Testing",
            description: "This Poll is created for Testing purposes only",
            link: "https://aeternity.com/",
            is_listed: true
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
        let addDelegation = await registryContract.methods.delegate(otherKeypair.publicKey);
        assert.equal(addDelegation.result.returnType, 'ok');

        let addDelegationError = await registryContract.methods.delegate(ownerKeypair.publicKey).catch(e => e);
        assert.include(addDelegationError.decodedError, 'CALLER_IS_DELEGATEE_DISALLOWED');

        let registryState = await registryContract.methods.get_state();
        assert.deepEqual(registryState.decodedResult.delegations, [[ownerKeypair.publicKey, otherKeypair.publicKey]]);

        let delegationsFrom = await registryContract.methods.delegations(ownerKeypair.publicKey);
        assert.deepEqual(delegationsFrom.decodedResult, [[ownerKeypair.publicKey, otherKeypair.publicKey]]);

        let delegationsFor = await registryContract.methods.delegations(otherKeypair.publicKey);
        assert.deepEqual(delegationsFor.decodedResult, [[ownerKeypair.publicKey, otherKeypair.publicKey]]);
    });

    it('Revoke Delegation', async () => {
        let revokeDelegation = await registryContract.methods.revoke_delegation();
        assert.equal(revokeDelegation.result.returnType, 'ok');

        let registryState = await registryContract.methods.get_state();
        assert.deepEqual(registryState.decodedResult.delegations, []);
    });

    it('Has Voted or Delegated', async () => {
        let hasVotedOrDelegated1 = await registryContract.methods.has_voted_or_delegated(ownerKeypair.publicKey, 0);
        assert.deepEqual(hasVotedOrDelegated1.decodedResult, {
            has_voted: false,
            has_delegated: false,
            delegated_to: undefined,
            voter_or_delegatee_vote_option: undefined
        });

        // add delegation
        await registryContract.methods.delegate(otherKeypair.publicKey);
        let hasVotedOrDelegated2 = await registryContract.methods.has_voted_or_delegated(ownerKeypair.publicKey, 0);
        assert.deepEqual(hasVotedOrDelegated2.decodedResult, {
            has_voted: false,
            has_delegated: true,
            delegated_to: otherKeypair.publicKey,
            voter_or_delegatee_vote_option: undefined
        });

        // add vote by delegatee
        const otherPollContract = await otherClient.getContractInstance(pollSource, {contractAddress: pollContract.deployInfo.address});
        await otherPollContract.methods.vote(1);
        let hasVotedOrDelegated3 = await registryContract.methods.has_voted_or_delegated(ownerKeypair.publicKey, 0);
        assert.deepEqual(hasVotedOrDelegated3.decodedResult, {
            has_voted: false,
            has_delegated: true,
            delegated_to: otherKeypair.publicKey,
            voter_or_delegatee_vote_option: 1
        });

        // add vote
        await pollContract.methods.vote(2);
        let hasVotedOrDelegated4 = await registryContract.methods.has_voted_or_delegated(ownerKeypair.publicKey, 0);
        assert.deepEqual(hasVotedOrDelegated4.decodedResult, {
            has_voted: true,
            has_delegated: true,
            delegated_to: otherKeypair.publicKey,
            voter_or_delegatee_vote_option: 2
        });

        let hasVotedOrDelegated5 = await registryContract.methods.has_voted_or_delegated(otherKeypair.publicKey, 0);
        assert.deepEqual(hasVotedOrDelegated5.decodedResult, {
            has_voted: true,
            has_delegated: false,
            delegated_to: undefined,
            voter_or_delegatee_vote_option: 1
        });

    });
});
