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

# create a shared volume
QUEUE_VOLUME_EXISTS=$(docker volume ls --format "{{.Name}}" | grep ^dhttp-queue-data$)
if [ -z $QUEUE_VOLUME_EXISTS ]; then
  docker volume create \
    dhttp-queue-data
fi

# remove existing queue container if necessary
QUEUE_EXISTS=$(docker ps -a --format "{{.Names}}" | grep ^dhttp-queue$)
if [[ ! -z $QUEUE_EXISTS ]]; then
  docker stop dhttp-queue
  docker rm dhttp-queue
fi

# spin up a queue instance
docker run \
  --name dhttp-queue \
  --hostname `hostname` \
  --publish 5672:5672 \
  --publish 15672:15672 \
  --volume dhttp-queue-data:/var/lib/rabbitmq \
  --env RABBITMQ_DEFAULT_USER="$QUEUE_USERNAME" \
  --env RABBITMQ_DEFAULT_PASS="$QUEUE_PASSWORD" \
  --env RABBITMQ_DEFAULT_VHOST="$QUEUE_VHOST" \
  --restart=always \
  --detach \
  rabbitmq:3.6-management

# 
# wait for start-up
COUNT=0
TIMEOUT=60
echo -e "waiting for rmq to start\n"
while [ 1 ]; do
  if [[ $COUNT -eq $TIMEOUT ]]; then
    echo -e "\n"
    echo "ERROR: rmq failed to start within time limit"
    exit 0
  fi
  
  LOGS=$(docker logs 2>&1 dhttp-queue | grep "Server startup complete")
  if [[ ! -z $LOGS ]]; then
    echo -ne "\n"
    break
  fi
  
  COUNT=$(expr $COUNT + 1)
  FILLED=$(printf '█%.0s' $(seq 0 `expr $COUNT - 1`))
  UNFILLED=$(printf ' %.0s' $(seq 0 `expr $TIMEOUT - $COUNT`))
  echo -ne "[$FILLED$UNFILLED]\r"
  sleep 1
done

echo ""
docker ps | grep dhttp-queue
echo ""

echo "-----------------------------------"
echo "         RMQ CONTAINER UP          "
echo "-----------------------------------"
