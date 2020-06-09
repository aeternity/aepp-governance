FROM node:12-alpine as build

RUN apk add --no-cache git
RUN adduser --disabled-password --gecos "" app

WORKDIR /app
RUN chown -R app:app /app
USER app

COPY package.json /app
RUN npm install

COPY . /app
RUN npm run build

ARG GIT_REV
RUN sed -i -r "s/GIT_REV/${GIT_REV}/g" /app/dist/bundle.js

FROM nginx:alpine as server

COPY default.conf /etc/nginx/conf.d/
COPY --from=build /app/dist/ /usr/share/nginx/html/
