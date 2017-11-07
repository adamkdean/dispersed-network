#!/bin/bash
#   __   __  __  ___ __  __  ___ __
#  |  \|/__`|__)|__ |__)/__`|__ |  \
#  |__/|.__/|   |___|  \.__/|___|__/
#              ______    __  __
#         |\ ||__  ||  |/  \|__)|__/
#         | \||___ ||/\|\__/|  \|  \
#
# dispersed network proof of concept
# (C) 2017 Adam K Dean <akd@dadi.co>

# set cwd to script root
cd "${0%/*}"

# load the config
source ../config/config.sh

# ensure host has docker installed
if ! [ -x "$(command -v docker)" ]; then
  curl -fsSL get.docker.com | sh
  echo "-----------------------------------"
  echo "         DOCKER INSTALLED          "
  echo "-----------------------------------"
fi

# create user defined network
NETWORK_EXISTS=$(docker network ls --format "{{.Name}}" | grep ^dn-network$)
if [ -z $NETWORK_EXISTS ]; then
  docker network create \
    --driver bridge \
    dn-network
fi

# build host image
docker build \
  --tag dn-host \
  .
  
# remove existing host container if necessary
HOST_EXISTS=$(docker ps -a --format "{{.Names}}" | grep ^dn-host$)
if [[ ! -z $HOST_EXISTS ]]; then
  docker stop dn-host
  docker rm dn-host
fi

# create first host
docker run \
  --name dn-host \
  --hostname `hostname` \
  --network dn-network \
  --env QUEUE_ADDRESS="$QUEUE_ADDRESS" \
  --restart=always \
  --detach \
  dn-host:latest

echo ""
docker ps | grep dn-host
echo ""

echo "-----------------------------------"
echo "        HOST CONTAINER UP          "
echo "-----------------------------------"
