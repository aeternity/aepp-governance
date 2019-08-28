const util = require('./util');

const delegationLogic = {};

delegationLogic.findDelegationEvents = async (aeternity, height) => {
    const registryCreationHeight = await aeternity.registryCreationHeight();

    const microBlockHashes = await util.range(registryCreationHeight, height).asyncMap(aeternity.microBlocks);
    const registryContractTransactions = await microBlockHashes.asyncMap(aeternity.contractTransactionHashes);
    const registryContractEvents = await registryContractTransactions.asyncMap(aeternity.transactionEvent);

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
