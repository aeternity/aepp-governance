const delegationLogic = {};
const aeternity = require('./aeternity');

const range = (start, end) => {
    return (new Array(end - start + 1)).fill(undefined).map((_, i) => i + start);
};

delegationLogic.findDelegationEvents = async () => {
    await aeternity.init();
    const height = await aeternity.height();
    const registryCreationHeight = await aeternity.registryCreationHeight();
    console.log(registryCreationHeight);

    console.log();

    const microBlockHashes = await range(registryCreationHeight, height).reduce(async (promiseAcc, height) => {
        const acc = await promiseAcc;
        process.stdout.write(".");
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
    return delegationEvents
};

module.exports = delegationLogic;
