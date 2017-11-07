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
NETWORK_EXISTS=$(docker network ls --format "{{.Name}}" | grep ^dhttp-network$)
if [ -z $NETWORK_EXISTS ]; then
  docker network create \
    --driver bridge \
    dhttp-network
fi

# build host image
docker build \
  --tag dhttp-host \
  .
  
# remove existing host container if necessary
HOST_EXISTS=$(docker ps -a --format "{{.Names}}" | grep ^dhttp-host$)
if [[ ! -z $HOST_EXISTS ]]; then
  docker stop dhttp-host
  docker rm dhttp-host
fi

# create first host
docker run \
  --name dhttp-host \
  --hostname `hostname` \
  --network dhttp-network \
  --env QUEUE_ADDRESS="$QUEUE_ADDRESS" \
  --restart=always \
  --detach \
  dhttp-host:latest

echo ""
docker ps | grep dhttp-host
echo ""

echo "-----------------------------------"
echo "        HOST CONTAINER UP          "
echo "-----------------------------------"
