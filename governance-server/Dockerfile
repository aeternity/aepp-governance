FROM node:16-alpine

ARG GIT_REV

WORKDIR /app/governance-server
COPY governance-server/package.json /app/governance-server
RUN npm install

COPY governance-server /app/governance-server
COPY governance-contracts/generated /app/governance-contracts/generated

RUN sed -i "s/const GIT_REV.*/const GIT_REV = \"${GIT_REV}\";/g" index.js

EXPOSE 3000

CMD ["npm", "start"]
