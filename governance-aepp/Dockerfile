FROM node:16-alpine as build

RUN apk add --no-cache git
WORKDIR /app

COPY package.json /app
RUN npm install

COPY . /app
RUN npm run build

ARG GIT_REV
RUN sed -i -r "s/GIT_REV/${GIT_REV}/g" /app/dist/js/help*

FROM nginx:alpine as server

COPY default.conf /etc/nginx/conf.d/
COPY --from=build /app/dist/ /usr/share/nginx/html/
