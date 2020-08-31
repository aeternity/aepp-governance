const delegationLogic = {};

delegationLogic.findDelegationEvents = async (cache, aeternity, height, setCache = true) => {
    const result = async () => {
        const contractTransactionHashes = async () => {
            if (process.env.MIDDLEWARE_URL) {
                const middlewareContractTransactions = await aeternity.middlewareContractTransactions(height);
                return middlewareContractTransactions.map(tx => ({tx: tx}));
            } else {
                const registryCreationHeight = await aeternity.registryCreationHeight();
                return aeternity.nodeContractTransactions(registryCreationHeight, height);
            }
        };

        const registryContractTransactions = await contractTransactionHashes();
        const registryContractEvents = await registryContractTransactions.asyncMap(aeternity.transactionEvent);

        return registryContractEvents
          .filter(event => event && event.height <= height)
          .filter(event => ["Delegation", "RevokeDelegation"].includes(event.topic))
          .sort((a, b) => a.height - b.height || a.nonce - b.nonce)
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
