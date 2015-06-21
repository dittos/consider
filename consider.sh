#!/bin/sh
CONSIDER_REPO=$1 CONSIDER_PR_ID=$2 java -jar target/consider-1.0-SNAPSHOT.jar server config.yml
