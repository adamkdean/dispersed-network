#!/bin/bash

# set cwd to script path
cd "${0%/*}"

# create user defined network
NETWORK_EXISTS=$(docker network ls --format "{{.Name}}" | grep ^dhttp-network$)
if [ -z $NETWORK_EXISTS ]; then
  docker network create \
    --driver bridge \
    dhttp-network
fi

# create a shared volume
QUEUE_VOLUME_EXISTS=$(docker volume ls --format "{{.Name}}" | grep ^dhttp-queue-data$)
if [ -z $QUEUE_VOLUME_EXISTS ]; then
  docker volume create \
    dhttp-queue-data
fi

# remove existing queue container if necessary
EXISTING_QUEUE=$(docker ps -a --format "{{.Names}}" | grep ^dhttp-queue$)
if [[ ! -z $EXISTING_QUEUE ]]; then
  docker rm \
    --force \
    $EXISTING_QUEUE
fi

# spin up a queue instance, publish management port (15672)
docker run \
  --name dhttp-queue \
  --hostname dhttp-queue \
  --network dhttp-network \
  --publish 15672:15672 \
  --volume dhttp-queue-data:/var/lib/rabbitmq \
  --env RABBITMQ_ERLANG_COOKIE="superSecret" \
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

echo "-----------------------------"
echo "          RMQ READY          "
echo "-----------------------------"