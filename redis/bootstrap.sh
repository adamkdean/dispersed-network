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

# create redis volume if required
REDIS_VOLUME_EXISTS=$(docker volume ls --format "{{.Name}}" | grep ^dn-redis-data$)
if [ -z $REDIS_VOLUME_EXISTS ]; then
  docker volume create \
    dn-redis-data
fi

# remove existing redis container if necessary
REDIS_EXISTS=$(docker ps -a --format "{{.Names}}" | grep ^dn-redis$)
if [[ ! -z $REDIS_EXISTS ]]; then
  docker stop dn-redis
  docker rm dn-redis
fi

# update redis config with actual password
sed -i "s/PASSWORD_PLACEHOLDER/$REDIS_PASSWORD/g" conf/redis.conf

# run docker registry
docker run \
  --name dn-redis \
  --volume dn-redis-data:/data \
  --volume $(pwd)/conf:/conf \
  --publish 6379:6379 \
  --restart=always \
  --detach \
  redis:4.0 \
    redis-server /conf/redis.conf --appendonly yes

echo ""
docker ps | grep dn-redis
echo ""

echo "-----------------------------------"
echo "        REDIS CONTAINER UP         "
echo "-----------------------------------"