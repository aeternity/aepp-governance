# How to verify governance poll results

## Prerequisites
 - up to date nodejs and npm installed
 - access to an aeternity full-node with debug endpoints exposed, per default it connects to an aeternity hosted node
 
## Setup
 - `git clone https://github.com/aeternity/aepp-governance`
 - `cd aepp-governance/governance-server`
 - `npm install`

The verification script is located in `verify.js`. You can choose a different governance registry contract or your your own node in `verifyConstants`.

Otherwise the script is configured to run against the current mainnet governance registry.

## Verify

To verify a poll execute `npm run verify POLL_ID`, where you replace `POLL_ID` with the poll id you want to check.
It may take a few minutes to fetch all the necessary data from the node and compute the result, afterwards it will be shown in the console.

Example Result:
```
Poll #1 ct_Wy5rWfGnXiprmXBYgeak217MshNHe24nHsBA8NrdLAkpQBi72
Poll NOT closed (Results NOT final)
Total Stake: 56618.01 AE
Percentage of total supply: 0.02 %
Number of votes: 6
Votes for Option: Awesome 99.83 %
Votes for Option: Ok 0.17 %
```

To speed up the verification process you can provide a middleware url, that is used to fetch some data more efficiently, e.g. `MIDDLEWARE_URL=https://mainnet.aeternity.io/mdw npm run verify 1`.

## Explanation

 - all delegations are fetched from the governance registry smart contract
 - in case of polls that are already finished a historic delegation state is assembled from `Delegation` and `RevokeDelegation` events emitted by the smart contract in the past
 - all votes are fetched from the specified poll smart contract
 - for each voter or delegator the balance (if closed at closing height) is fetched from the node
 - all data is assembled, delegators balances are summed for the option of the delegatees vote, normal account vote balances are added to their vote option, while account votes always overwrite any delegation
 
 Governance rules are defined in the main readme: https://github.com/aeternity/aepp-governance/blob/master/Readme.md


