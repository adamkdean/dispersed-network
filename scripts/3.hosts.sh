#!/bin/bash

# set cwd to script path
cd "${0%/*}"

# build host image
docker build \
  --tag dhttp-host \
  ../host/
  
# remove existing host container if necessary
EXISTING_HOSTS=$(docker ps -a --format "{{.Names}}" | grep ^dhttp-host-[0-9+]$)
if [[ ! -z $EXISTING_HOSTS ]]; then
  docker rm \
    --force \
    $EXISTING_HOSTS
fi

# create first host
docker run \
  --name dhttp-host-1 \
  --hostname dhttp-host-1 \
  --network dhttp-network \
  --env NICKNAME="prime-alpha (dhttp-host-1)" \
  --detach \
  dhttp-host:latest
  
# create second host
docker run \
  --name dhttp-host-2 \
  --hostname dhttp-host-2 \
  --network dhttp-network \
  --env NICKNAME="backup-buddy (dhttp-host-2)" \
  --detach \
  dhttp-host:latest

# create third host
docker run \
  --name dhttp-host-3 \
  --hostname dhttp-host-3 \
  --network dhttp-network \
  --env NICKNAME="third-wheel (dhttp-host-3)" \
  --detach \
  dhttp-host:latest

echo "-----------------------------"
echo "         HOSTS READY         "
echo "-----------------------------"