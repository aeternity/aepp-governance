# How to run governance aepp and server

## Prerequisites
 - up to date nodejs, npm and docker installed
 - access to an aeternity full-node with debug endpoints exposed

## Contracts
[governance-contracts](../governance-contracts) contains the smart contracts and tests, setup with [aeproject](https://github.com/aeternity/aepp-aeproject-js).
Each poll smart contract is deployed by the user creating the poll from within the aepp. The registry smart contract is deployed once and each poll contract is registered there.

 - install and start [aeproject](https://github.com/aeternity/aepp-aeproject-js)
 - run contract tests with `aeproject test`
 - deploy registry contract with `aeproject deploy -n testnet/mainnet -s YOUR_SECRET_KEY`

## Server
[governance-server](../governance-server) contains the trustless server implementation to support the governance aepp with aggregated data.
The server is used to provide additional data to the aepp for better usability, which otherwise would take long to query from the node directly. It is in no way required to use the aepp.

Additionally [governance-server](../governance-server) contains a script to independently verify poll results, described in  [How to verify results](./how-to-verify-results.md).

**Requirements**
 - deployed registry contract address
 - [aeternity full-node](https://github.com/aeternity/aeternity) with debug endpoints url
 - redis
 - [middleware](https://github.com/aeternity/ae_mdw) (optional, for better performance)
 
 **Running (locally with hosted mainnet node)**
```
cd governance-server
npm install

docker run --name server-redis -p 6379:6379 -d redis

CONTRACT_ADDRESS=ct_ouZib4wT9cNwgRA1pxgA63XEUd8eQRrG8PcePDEYogBc1VYTq \
NODE_URL=https://mainnet.aeternity.io/ \
WEBSOCKET_URL=wss://mainnet.aeternity.io/mdw/websocket \
REDIS_URL=redis://localhost:6379 \
MIDDLEWARE_URL=https://mainnet.aeternity.io/mdw \
PORT=3000 \
npm run start
```

**Running (using docker compose)**
```
cd governance-server

docker-compose up -d

# check logs using docker-compose logs -f
```

## Aepp
[governance-aepp](../governance-aepp) contains the frontend decentralized application for governance. It is usable from within the [base-aepp](https://base.aepps.com/) on mobile or on itself in read-only mode on desktop.
Configuration for node selection and choosing the registry smart contract address can be found in `src/utils/settings.js`.

**Running locally**
```
cd governance-aepp

npm install
npm run dev
```

