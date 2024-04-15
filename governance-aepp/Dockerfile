FROM node:20-alpine as build

RUN apk add --no-cache git
WORKDIR /app/governance-aepp

COPY governance-aepp/package.json /app/governance-aepp
RUN npm install

COPY governance-aepp /app/governance-aepp
COPY governance-contracts/generated /app/governance-contracts/generated
RUN npm run build

ARG GIT_REV
RUN sed -i -r "s/GIT_REV/${GIT_REV}/g" /app/governance-aepp/dist/js/help*

FROM nginx:alpine as server

COPY governance-aepp/default.conf /etc/nginx/conf.d/
COPY governance-aepp/docker-override-env.sh /docker-entrypoint.d

COPY --from=build /app/governance-aepp/dist/ /usr/share/nginx/html/
RUN cp /usr/share/nginx/html/index.html /usr/share/nginx/html/index.template.html
