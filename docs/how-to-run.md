# How to run governance aepp and server

## Prerequisites
 - up to date nodejs, npm and docker installed
 - access to an aeternity full-node with debug endpoints exposed, per default it connects to an aeternity hosted node

## Contracts
[governance-contracts](../governance-contracts) contains the smart contracts and tests, setup with [aeproject](https://github.com/aeternity/aepp-aeproject-js).
Each poll smart contract is deployed by the user creating the poll from within the aepp. The registry smart contract is deployed once and each poll contract is registered there.

 - install and start [aeproject](https://github.com/aeternity/aepp-aeproject-js)
 - run contract tests with `aeproject test`
 - deploy registry contract with `aeproject deploy -n testnet/mainnet -s YOUR_SECRET_KEY`

