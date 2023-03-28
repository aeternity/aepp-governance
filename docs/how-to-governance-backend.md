# How the governance backend works

## Why a backend?

The governance system as described depends on a big number of calculations in order to present the complete information about each poll to the user.
Within a web-application this is not feasible, as it implies many calls to different hosted services, as the contract state, as well as the balance at poll height and the complete history of delegation has to be queried for each participant.

The backend is only needed to show this information in a good way to the user, the governance aepp is completely usable, just without displaying this information as well. The poll creation and participation work in direct communication with a smart contract and are unrelated to using the backend.

Verifying the final or intermediate result of any poll is also possible without the backend, but not integrated in the web-app. The process is described in  - [GUIDE: How to verify results](./how-to-verify-results.md).

## Backend routes and usage

The backend is currently deployed at:
 - Testnet: https://governance-server-testnet.prd.aepps.com
 - Mainnet: https://governance-server-mainnet.prd.aepps.com

Routes:
 - `GET /votesState/:poll_contract_address` detailed state of polling result for a specific poll address
 - `GET /pollOverview/:poll_contract_address` simple state of polling result for a specific poll address
 - `GET /delegatedPower/:account_address` delegations overview for a specific account address
 - `GET /accountPollVoterAuthor/:account_address` participation overview for a specific account address
 - `GET /pollOrdering` list of provided ordering of polls to be displayed
