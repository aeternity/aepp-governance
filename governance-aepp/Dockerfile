FROM node:16-alpine as build

RUN apk add --no-cache git
WORKDIR /app/governance-aepp

COPY governance-aepp/package.json /app/governance-aepp
RUN npm install

ARG VUE_APP_AE_MAINNET_BACKEND_URL
ENV VUE_APP_AE_MAINNET_BACKEND_URL=${VUE_APP_AE_MAINNET_BACKEND_URL}

ARG VUE_APP_AE_UAT_BACKEND_URL
ENV VUE_APP_AE_UAT_BACKEND_URL=${VUE_APP_AE_UAT_BACKEND_URL}

COPY governance-aepp /app/governance-aepp
COPY governance-contracts/generated /app/governance-contracts/generated
RUN npm run build

ARG GIT_REV
RUN sed -i -r "s/GIT_REV/${GIT_REV}/g" /app/governance-aepp/dist/js/help*

FROM nginx:alpine as server

COPY governance-aepp/default.conf /etc/nginx/conf.d/
COPY --from=build /app/governance-aepp/dist/ /usr/share/nginx/html/
