# Governance Aepp

This repository will hold the full system used for the aeternity polling system.
It consists of the used smart contracts, including their tests.
A trustless backend service used for aggregation and caching of results for better presentation.
Additionally there will be an frontend-aepp that allows for user-friendly registration, discovery and participation in polls.

## Resources

[GUIDE: How to verify results](./docs/how-to-verify-results.md)
[GUIDE: How to run governance locally](./docs/how-to-run.md)

## Introduction

Earlier this year there was a proposal to include a polling system directly in the aeternity protocol, in [Polling System Protocol](https://github.com/aeternity/protocol/blob/gov/POLLING_SYSTEM.md), but this was not finalized yet.

This project aims to build a first version of the aeternity polling system as smart contract and aepp to explore governance models better, so in a later stage a more informed decision can be made of what to include on protocol level.
 
The governance aepp will implement a delegated weighted polling mechanism, polls and votes will be registered on-chain together with minimal meta information.
Discussions around poll proposals should happen off-chain, e.g. the aeternity forum.
Due to building this as smart contract system a few limitations are introduced, for example the final poll results will not be published within the smart contract, but will be verifiable using external scripts.
 
## Rules

 - Poll voting options are non-binary but limited to one vote per account or delegatee
 - There can only be one delegation from one account, but multiple for one account 
 - Delegations are global and permanent, meaning one delegation is in effect for all polls
 - Delegations can be updated and revoked at any time by the delegator
 - Delegations can be recursive
 - Voting on polls does overwrite a delegation from this account for the single poll
 - Votes can be updated and revoked until a poll is closed
 - A poll is counted with the state of its closing height, meaning considering the active delegations and account stakes at this height
 - The closing height is defined on poll creation, but is optional to be able to create ongoing signaling systems

## Ideas

 - Each poll should be a single smart contract and in the future there could be multiple registries that provide different views on the same polls
 - Standardizing the polling system as aeternity aexpansion could yield more powerful alternative implementations without breaking compatibility in the future
 - Certain events should be logged in the smart contract to be able to listen for them
