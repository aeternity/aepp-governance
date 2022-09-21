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

const {assert} = require('chai');
const {utils, wallets} = require('@aeternity/aeproject');

const registrySource = utils.getContractContent('./contracts/Registry.aes');
const pollSource = utils.getContractContent('./contracts/Poll_Iris.aes');

const hexToUint8 = (hex) => Uint8Array.from(Buffer.from(hex, 'hex'));
const uint8ToHex = (uint8) => Buffer.from(uint8).toString('hex');


describe('Governance Contracts', () => {
    let aeSdk;
    let registryContract, pollContract;

    before(async () => {
        aeSdk = await utils.getSdk();
    });

    it('Deploying Governance', async () => {
        registryContract = await aeSdk.getContractInstance({source: registrySource});
        const init = await registryContract.methods.init();
        assert.equal(init.result.returnType, 'ok');
    });

    it('Add Poll', async () => {
        pollContract = await aeSdk.getContractInstance({source: pollSource});
        const vote_options = {0: "Yes, test more", 1: "No, test less", 2: "Who cares?"};
        const close_height = undefined;

        const metadata1 = {
            title: "Lorem ipsum dolor sit amet, consectetur adipiscing.",
            description: "This Poll is created for Testing purposes only",
            link: "https://aeternity.com/",
            spec_ref: "d4f02eaafd1a9e9de7d10972ca8e47fa7a985825c3c9c1e249c72683cb3e4f19"
        };

        const init1 = await pollContract.methods.init(metadata1, vote_options, close_height).catch(e => e);
        assert.include(init1.message, 'TITLE_STRING_TO_LONG');

        const metadata2 = {
            title: "Test",
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla pretium volutpat enim, in feugiat mi congue feugiat. Nam gravida efficitur convallis. Suspendisse congue tellus nulla, eu finibus nunc egestas sed. Cras luctus mauris iaculis fermentum posuere. Sed ut urna sit amet lorem commodo gravida..",
            link: "https://aeternity.com/",
            spec_ref: "d4f02eaafd1a9e9de7d10972ca8e47fa7a985825c3c9c1e249c72683cb3e4f19"
        };

        const init2 = await pollContract.methods.init(metadata2, vote_options, close_height).catch(e => e);
        assert.include(init2.message, 'DESCRIPTION_STRING_TO_LONG');


        const metadata = {
            title: "Testing",
            description: "This Poll is created for Testing purposes only",
            link: "https://aeternity.com/",
            spec_ref: "d4f02eaafd1a9e9de7d10972ca8e47fa7a985825c3c9c1e249c72683cb3e4f19"
        };

        const init = await pollContract.methods.init(metadata, vote_options, close_height);
        assert.equal(init.result.returnType, 'ok');

        let addPoll = await registryContract.methods.add_poll(init.address, true);
        assert.equal(addPoll.decodedEvents[0].name, 'AddPoll');
        assert.equal(addPoll.decodedEvents[0].args[0], init.address);
        assert.equal(addPoll.decodedEvents[0].args[1], addPoll.decodedResult);
        assert.equal(addPoll.decodedResult, 0);
    });

    it('Get Polls', async () => {
        const polls = await registryContract.methods.polls();
        assert.equal(polls.decodedResult.get(0n).title, 'Testing');
        assert.equal(polls.decodedResult.get(0n).is_listed, true);
        assert.equal(polls.decodedResult.get(0n).poll, pollContract.deployInfo.address);
        assert.equal(polls.decodedResult.get(0n).close_height, undefined);
    });

    it('Get Poll', async () => {
        const polls = await registryContract.methods.polls();
        pollContract = await aeSdk.getContractInstance({
            source: pollSource,
            contractAddress: polls.decodedResult.get(0n).poll
        });
        let pollState = await pollContract.methods.get_state();
        assert.equal(pollState.decodedResult.metadata.title, 'Testing');
        assert.equal(uint8ToHex(pollState.decodedResult.metadata.spec_ref), 'd4f02eaafd1a9e9de7d10972ca8e47fa7a985825c3c9c1e249c72683cb3e4f19');
        assert.equal(pollState.decodedResult.close_height, undefined);
        assert.equal(pollState.decodedResult.author, wallets[0].publicKey);
        assert.deepEqual(pollState.decodedResult.vote_options, new Map([[0n, 'Yes, test more'], [1n, 'No, test less'], [2n, 'Who cares?']]));

        let title = await pollContract.methods.title();
        assert.equal(title.decodedResult, 'Testing');

        let metadata = await pollContract.methods.metadata();
        assert.deepEqual(metadata.decodedResult, {
            description: 'This Poll is created for Testing purposes only',
            link: 'https://aeternity.com/',
            title: 'Testing',
            spec_ref: hexToUint8("d4f02eaafd1a9e9de7d10972ca8e47fa7a985825c3c9c1e249c72683cb3e4f19")
        });

        let votes = await pollContract.methods.votes();
        assert.deepEqual(votes.decodedResult, new Map());
    });

    it('Add Vote', async () => {
        pollContract = await aeSdk.getContractInstance({
            source: pollSource,
            contractAddress: pollContract.deployInfo.address
        });
        let vote = await pollContract.methods.vote(2);

        assert.equal(vote.result.returnType, 'ok');
        assert.equal(vote.decodedEvents[0].name, 'Vote');
        assert.equal(vote.decodedEvents[0].args[0], pollContract.deployInfo.address.replace('ct_', 'ak_'));
        assert.equal(vote.decodedEvents[0].args[1], wallets[0].publicKey);
        assert.equal(vote.decodedEvents[0].args[2], 2n);
        assert.equal(vote.decodedResult, 0);

        let pollState = await pollContract.methods.get_state();
        assert.deepEqual(pollState.decodedResult.votes, new Map([['ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk', 2n]]));
    });

    it('Add Vote; Failing, poll already closed', async () => {
        const otherPollContract = await aeSdk.getContractInstance({
            source: pollSource,
            onAccount: await utils.getDefaultAccounts()[1]
        });

        const metadata = {
            title: "Testing",
            description: "This Poll is created for Testing purposes only",
            link: "https://aeternity.com/",
            spec_ref: "d4f02eaafd1a9e9de7d10972ca8e47fa7a985825c3c9c1e249c72683cb3e4f19"
        };
        const vote_options = {0: "Only Option"};
        const close_height = await aeSdk.height();

        const init = await otherPollContract.methods.init(metadata, vote_options, close_height);
        assert.equal(init.result.returnType, 'ok');

        let voteError = await otherPollContract.methods.vote(0).catch(e => e);
        assert.include(voteError.message, 'POLL_ALREADY_CLOSED');
    });

    it('Revoke Vote', async () => {
        let revokeVote = await pollContract.methods.revoke_vote();
        assert.equal(revokeVote.result.returnType, 'ok');
        assert.equal(revokeVote.decodedEvents[0].name, 'RevokeVote');
        assert.equal(revokeVote.decodedEvents[0].args[0], pollContract.deployInfo.address.replace('ct_', 'ak_'));
        assert.equal(revokeVote.decodedEvents[0].args[1], wallets[0].publicKey);
        assert.equal(revokeVote.decodedResult, 0);


        let pollState = await pollContract.methods.get_state();
        assert.deepEqual(pollState.decodedResult.votes, new Map());
    });

    it('Add Vote; Failing, option not known', async () => {
        pollContract = await aeSdk.getContractInstance({
            source: pollSource,
            contractAddress: pollContract.deployInfo.address
        });
        let voteError = await pollContract.methods.vote(3).catch(e => e);
        assert.include(voteError.message, 'VOTE_OPTION_NOT_KNOWN');
    });

    it('Add Delegation', async () => {
        let addDelegation1 = await registryContract.methods.delegate(wallets[1].publicKey);

        assert.equal(addDelegation1.result.returnType, 'ok');
        assert.equal(addDelegation1.decodedEvents[0].name, 'Delegation');
        assert.equal(addDelegation1.decodedEvents[0].args[0], wallets[0].publicKey);
        assert.equal(addDelegation1.decodedEvents[0].args[1], wallets[1].publicKey);

        let addDelegationError = await registryContract.methods.delegate(wallets[0].publicKey).catch(e => e);
        assert.include(addDelegationError.message, 'CALLER_IS_DELEGATEE_DISALLOWED');

        let delegations = await registryContract.methods.delegations();
        assert.deepEqual(delegations.decodedResult, new Map([[wallets[0].publicKey, wallets[1].publicKey]]));

        let delegationsFrom = await registryContract.methods.delegatee(wallets[0].publicKey);
        assert.equal(delegationsFrom.decodedResult, wallets[1].publicKey);

        let delegationsFor1 = await registryContract.methods.delegators(wallets[0].publicKey, []);
        assert.deepEqual(delegationsFor1.decodedResult, new Map());

        let delegationsFor2 = await registryContract.methods.delegators(wallets[1].publicKey, []);
        assert.deepEqual(delegationsFor2.decodedResult, new Map([[wallets[0].publicKey, wallets[1].publicKey]]));
    });

    it('Revoke Delegation', async () => {
        let revokeDelegation = await registryContract.methods.revoke_delegation();

        assert.equal(revokeDelegation.result.returnType, 'ok');
        assert.equal(revokeDelegation.decodedEvents[0].name, 'RevokeDelegation');
        assert.equal(revokeDelegation.decodedEvents[0].args[0], wallets[0].publicKey);

        let delegations = await registryContract.methods.delegations();
        assert.deepEqual(delegations.decodedResult, new Map());
    });

    it('Get Delegators', async () => {
        let addDelegation1 = await registryContract.methods.delegate(wallets[2].publicKey);
        assert.equal(addDelegation1.result.returnType, 'ok');

        const secondClientRegistryContract = await aeSdk.getContractInstance({
            source: registrySource,
            contractAddress: registryContract.deployInfo.address,
            onAccount: await utils.getDefaultAccounts()[1]
        });
        let addDelegation2 = await secondClientRegistryContract.methods.delegate(wallets[2].publicKey);
        assert.equal(addDelegation2.result.returnType, 'ok');

        let delegationsFor = await registryContract.methods.delegators(wallets[2].publicKey, []);
        assert.deepEqual(delegationsFor.decodedResult, new Map([[wallets[0].publicKey, wallets[2].publicKey], [wallets[1].publicKey, wallets[2].publicKey]]));

        let revokeDelegation1 = await registryContract.methods.revoke_delegation();
        assert.equal(revokeDelegation1.result.returnType, 'ok');

        let revokeDelegation2 = await secondClientRegistryContract.methods.revoke_delegation();
        assert.equal(revokeDelegation2.result.returnType, 'ok');
    });

    it('Get Version', async () => {
        let pollVersion = await pollContract.methods.version();
        assert.equal(pollVersion.decodedResult, 2n);

        let registryVersion = await registryContract.methods.version();
        assert.equal(registryVersion.decodedResult, 1n);
    })
});
