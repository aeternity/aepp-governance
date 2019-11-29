#!/bin/bash

GIT_REV="$(git rev-parse HEAD)"

docker build --build-arg GIT_REV=${GIT_REV} -t aeternity/governance-server .
docker push aeternity/governance-server:latest

#ssh governance-server 'docker-compose pull; docker-compose up -d'
#ssh governance-server 'docker image prune -af'
