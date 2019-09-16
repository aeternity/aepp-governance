const util = require('./util');

const delegationLogic = {};

delegationLogic.findDelegationEvents = async (cache, aeternity, height, setCache = true) => {
    const result = async () => {
        const contractTransactionHashes = async () => {
            if (process.env.MIDDLEWARE_URL) {
                return aeternity.middlewareContractTransactions(height);
            } else {
                const registryCreationHeight = await aeternity.registryCreationHeight();
                const microBlockHashes = await util.range(registryCreationHeight, height).asyncMap(aeternity.microBlocks);
                return microBlockHashes.asyncMap(aeternity.contractTransactionHashes);
            }
        };

        const registryContractTransactions = await contractTransactionHashes();
        const registryContractEvents = await registryContractTransactions.asyncMap(aeternity.transactionEvent);

        const sortedDelegationEvents = registryContractEvents
            .filter(event => event && event.height <= height)
            .filter(event => ["Delegation", "RevokeDelegation"].includes(event.topic))
            .sort((a, b) => a.height - b.height || a.nonce - b.nonce);

        return sortedDelegationEvents
    };

    if (setCache) {
        return cache.getOrSet(["findDelegationEvents", height], result);
    } else {
        return result();
    }
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
