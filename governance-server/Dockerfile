FROM node:16-alpine

ARG GIT_REV

WORKDIR /app
COPY package.json /app
RUN npm install

COPY . /app

RUN sed -i "s/const GIT_REV.*/const GIT_REV = \"${GIT_REV}\";/g" index.js

EXPOSE 3000

CMD ["npm", "start"]
