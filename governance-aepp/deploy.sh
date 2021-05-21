#!/usr/bin/env bash

docker build --build-arg GIT_REV=$(git rev-parse HEAD) -t thepiwo/governance-aepp . && docker push thepiwo/governance-aepp:latest
