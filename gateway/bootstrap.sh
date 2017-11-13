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
  --tag dn-gateway \
  .
  
# remove existing gateway container if necessary
GATEWAY_EXISTS=$(docker ps -a --format "{{.Names}}" | grep ^dn-gateway$)
if [[ ! -z $GATEWAY_EXISTS ]]; then
  docker stop dn-gateway
  docker rm dn-gateway
fi

# create fresh gateway container
docker run \
  --name dn-gateway \
  --hostname dn-gateway \
  --publish 80:80 \
  --env QUEUE_ADDRESS="$QUEUE_ADDRESS" \
  --env REDIS_ADDRESS="$REDIS_ADDRESS" \
  --env REDIS_PASSWORD="$REDIS_PASSWORD" \
  --restart=always \
  --detach \
  dn-gateway:latest

echo ""
docker ps | grep dn-gateway
echo ""
  
echo "-----------------------------------"
echo "       GATEWAY CONTAINER UP        "
echo "-----------------------------------"