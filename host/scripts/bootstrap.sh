#!/bin/bash

echo "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓"
echo "▓                                 ▓"
echo "▓   ▓▓▓   ▓  ▓ ▓▓▓▓▓ ▓▓▓▓▓ ▓▓▓    ▓"
echo "▓   ▓  ▓  ▓  ▓   ▓     ▓   ▓  ▓   ▓"
echo "▓   ▓  ▓  ▓▓▓▓   ▓     ▓   ▓▓▓    ▓"
echo "▓   ▓  ▓  ▓  ▓   ▓     ▓   ▓      ▓"
echo "▓   ▓▓▓   ▓  ▓   ▓     ▓   ▓      ▓"
echo "▓                                 ▓"
echo "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓"

# env variables
QUEUE_USERNAME="secretUser"
QUEUE_PASSWORD="tH1s15th3Secr3tp4ss"
QUEUE_VHOST="/dhttp"

# ensure host has docker installed
DOCKER_INSTALLED=$(docker -v | grep "not installed")
if [[ ! -z $DOCKER_INSTALLED ]]; then
  bash /vagrant/scripts/install-docker.sh
  echo "-----------------------------------"
  echo "         DOCKER INSTALLED          "
  echo "-----------------------------------"
fi

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

echo ""
docker ps | grep dhttp-host
echo ""

echo "-----------------------------------"
echo "         DHTTP HOST READY          "
echo "-----------------------------------"