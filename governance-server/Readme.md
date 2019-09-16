# Governance Aepp Server

## Verification of Polls

 - make sure up-to-date node is installed
 - install dependencies `npm install`
 - fast verification using middleware `MIDDLEWARE_URL=PUT_TO_MIDDLEWARE_SERVER npm run verify POLL_ID_OR_CONTRACT_ADDRESS`
 - slow verification (multiple hours) `npm run verify POLL_ID_OR_CONTRACT_ADDRESS`
 
## Running Server
 - make sure up-to-date node, docker and docker-compose is installed
 - install dependencies `npm install`
 - in `docker-compose.yml` set `NODE_URL` to url of your node
 - use `docker-compose up -d` to run dependencies (middleware + db, redis)
 - set environment variables `WEBSOCKET_URL` of middleware, `NODE_URL`, `CONTRACT_ADDRESS` of registry contract, `REDIS_URL` as cache, `COMPILER_URL` and `MIDDLEWARE_URL`
 - `npm start`
