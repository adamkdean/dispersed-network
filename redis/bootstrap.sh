#!/bin/bash

echo ""
echo "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓"
echo "▓                                 ▓"
echo "▓   ▓▓▓   ▓  ▓ ▓▓▓▓▓ ▓▓▓▓▓ ▓▓▓    ▓"
echo "▓   ▓  ▓  ▓  ▓   ▓     ▓   ▓  ▓   ▓"
echo "▓   ▓  ▓  ▓▓▓▓   ▓     ▓   ▓▓▓    ▓"
echo "▓   ▓  ▓  ▓  ▓   ▓     ▓   ▓      ▓"
echo "▓   ▓▓▓   ▓  ▓   ▓     ▓   ▓      ▓"
echo "▓                                 ▓"
echo "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓"
echo ""

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
REDIS_VOLUME_EXISTS=$(docker volume ls --format "{{.Name}}" | grep ^dhttp-redis-data$)
if [ -z $REDIS_VOLUME_EXISTS ]; then
  docker volume create \
    dhttp-redis-data
fi

# remove existing redis container if necessary
REDIS_EXISTS=$(docker ps -a --format "{{.Names}}" | grep ^dhttp-redis$)
if [[ ! -z $REDIS_EXISTS ]]; then
  docker stop dhttp-redis
  docker rm dhttp-redis
fi

# update redis config with actual password
sed -i "s/PASSWORD_PLACEHOLDER/$REDIS_PASSWORD/g" conf/redis.conf

# run docker registry
docker run \
  --name dhttp-redis \
  --volume dhttp-redis-data:/data \
  --volume $(pwd)/conf:/conf \
  --publish 6379:6379 \
  --restart=always \
  --detach \
  redis:4.0 \
    redis-server /conf/redis.conf --appendonly yes

echo "-----------------------------------"
echo "        REDIS CONTAINER UP         "
echo "-----------------------------------"

echo ""
docker ps | grep dhttp-redis
echo ""

echo "-----------------------------------"
echo "        DHTTP REDIS READY          "
echo "-----------------------------------"