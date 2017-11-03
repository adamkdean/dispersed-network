#!/bin/bash

# set cwd to script path
cd "${0%/*}"

# build gateway image
docker build \
  --tag dhttp-gateway \
  ../gateway/
  
# remove existing gateway container if necessary
EXISTING_GATEWAY=$(docker ps -a --format "{{.Names}}" | grep ^dhttp-gateway$)
if [[ ! -z $EXISTING_GATEWAY ]]; then
  docker rm \
    --force \
    $EXISTING_GATEWAY
fi

# create fresh gateway container
docker run \
  --name dhttp-gateway \
  --hostname dhttp-gateway \
  --network dhttp-network \
  --publish 80:80 \
  --detach \
  dhttp-gateway:latest

echo "-----------------------------"
echo "        GATEWAY READY        "
echo "-----------------------------"