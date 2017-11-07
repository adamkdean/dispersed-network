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

# build gateway image
docker build \
  --tag dhttp-gateway \
  .
  
# remove existing gateway container if necessary
GATEWAY_EXISTS=$(docker ps -a --format "{{.Names}}" | grep ^dhttp-gateway$)
if [[ ! -z $GATEWAY_EXISTS ]]; then
  docker stop dhttp-gateway
  docker rm dhttp-gateway
fi

# create fresh gateway container
docker run \
  --name dhttp-gateway \
  --hostname dhttp-gateway \
  --publish 80:80 \
  --env QUEUE_ADDRESS="$QUEUE_ADDRESS" \
  --restart=always \
  --detach \
  dhttp-gateway:latest

echo ""
docker ps | grep dhttp-gateway
echo ""
  
echo "-----------------------------------"
echo "       GATEWAY CONTAINER UP        "
echo "-----------------------------------"