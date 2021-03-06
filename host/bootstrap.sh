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
  --env QUEUE_ADDRESS="$QUEUE_ADDRESS" \
  --env REGISTRY_DOMAIN="$REGISTRY_DOMAIN" \
  --env REGISTRY_USER="$REGISTRY_USER" \
  --env REGISTRY_PASS="$REGISTRY_PASS" \
  --env REDIS_ADDRESS="$REDIS_ADDRESS" \
  --env REDIS_PASSWORD="$REDIS_PASSWORD" \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --restart=always \
  --detach \
  dn-host:latest

echo ""
docker ps | grep dn-host
echo ""

echo "-----------------------------------"
echo "        HOST CONTAINER UP          "
echo "-----------------------------------"
