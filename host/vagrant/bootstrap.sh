#!/bin/bash

echo "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓"
echo "▓                                 ▓"
echo "▓   ▓▓▓   ▓  ▓ ▓▓▓▓▓ ▓▓▓▓▓ ▓▓▓    ▓"
echo "▓   ▓  ▓  ▓  ▓   ▓     ▓   ▓  ▓   ▓"
echo "▓   ▓  ▓  ▓▓▓▓   ▓     ▓   ▓▓▓    ▓"
echo "▓   ▓  ▓  ▓  ▓   ▓     ▓   ▓      ▓"
echo "▓   ▓▓▓   ▓  ▓   ▓     ▓   ▓      ▓"
echo "▓                                 ▓"
echo "▓           host server           ▓"
echo "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓"

# env variables
# RABBITMQ_ERLANG_COOKIE="superSecret"
# RABBITMQ_DEFAULT_USER="secretUser"
# RABBITMQ_DEFAULT_PASS="tH1s15th3Secr3tp4ss"
# RABBITMQ_DEFAULT_VHOST="/dhttp"

# create user defined network
NETWORK_EXISTS=$(docker network ls --format "{{.Name}}" | grep ^dhttp-network$)
if [ -z $NETWORK_EXISTS ]; then
  docker network create \
    --driver bridge \
    dhttp-network
fi

# build host image
docker build \
  --tag dhttp-host \
  /vagrant
  
# remove existing host container if necessary
HOST_EXISTS=$(docker ps -a --format "{{.Names}}" | grep ^dhttp-host$)
if [[ ! -z $HOST_EXISTS ]]; then
  docker rm \
    --force \
    $HOST_EXISTS
fi

# create first host
docker run \
  --name dhttp-host \
  --hostname dhttp-host \
  --network dhttp-network \
  --env NICKNAME="no-name (dhttp-host)" \
  --detach \
  dhttp-host:latest

echo "-----------------------------------"
echo "        HOST CONTAINER UP          "
echo "-----------------------------------"