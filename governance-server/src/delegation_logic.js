const range = (start, end) => {
    return (new Array(end - start + 1)).fill(undefined).map((_, i) => i + start);
};

const delegationLogic = {};

delegationLogic.findDelegationEvents = async (aeternity, height) => {
    const registryCreationHeight = await aeternity.registryCreationHeight();
    const microBlockHashes = await range(registryCreationHeight, height).reduce(async (promiseAcc, height) => {
        const acc = await promiseAcc;
        process.stdout.write(".");

        //TODO handle chain to short
        return acc.concat((await aeternity.client.getGeneration(height)).microBlocks);
    }, Promise.resolve([]));

    const registryContractTransactions = await microBlockHashes.reduce(async (promiseAcc, hash) => {
        const acc = await promiseAcc;
        process.stdout.write(";");
        const txs = (await aeternity.client.getMicroBlockTransactions(hash));
        return acc.concat(txs.filter(tx => tx.tx.contractId === aeternity.contractAddress));
    }, Promise.resolve([]));

    const registryContractEvents = await registryContractTransactions.reduce(async (promiseAcc, tx) => {
        const acc = await promiseAcc;
        process.stdout.write(",");
        acc.push(await aeternity.transactionEvent(tx.hash));
        return acc;
    }, Promise.resolve([]));

    const delegationEvents = registryContractEvents.filter(event => ["Delegation", "RevokeDelegation"].includes(event.topic));
    const sortedDelegationEvents = delegationEvents.sort((a, b) => a.height - b.height || a.nonce - b.nonce);
    return sortedDelegationEvents
};

delegationLogic.calculateDelegations = (delegationEvents) => {
    const delegations = delegationEvents.reduce((acc, event) => {
        if (event.topic === "Delegation") {
            acc.set(event.delegator, event.delegatee);
        }
        if (event.topic === "RevokeDelegation") {
            acc.delete(event.delegator);
        }
        return acc;
    }, new Map());

    return Array.from(delegations.entries());
};

module.exports = delegationLogic;
