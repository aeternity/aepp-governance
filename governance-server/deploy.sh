#!/bin/bash

docker build -t aeternity/governance-server .
docker push aeternity/governance-server:latest

ssh governance-server 'docker-compose pull; docker-compose up -d'
ssh governance-server 'docker image prune -af'
