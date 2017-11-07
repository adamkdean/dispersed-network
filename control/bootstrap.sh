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

# build control image
docker build \
  --tag dn-control \
  .
  
# remove existing control container if necessary
CONTROL_EXISTS=$(docker ps -a --format "{{.Names}}" | grep ^dn-control$)
if [[ ! -z $CONTROL_EXISTS ]]; then
  docker stop dn-control
  docker rm dn-control
fi

# create fresh control container
docker run \
  --name dn-control \
  --hostname dn-control \
  --publish 80:80 \
  --env QUEUE_ADDRESS="$QUEUE_ADDRESS" \
  --env CONTROL_AUTH_TOKEN="$CONTROL_AUTH_TOKEN" \
  --restart=always \
  --detach \
  dn-control:latest

echo ""
docker ps | grep dn-control
echo ""
  
echo "-----------------------------------"
echo "       CONTROL CONTAINER UP        "
echo "-----------------------------------"