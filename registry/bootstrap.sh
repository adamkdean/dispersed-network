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

# set cwd to gateway root
cd "${0%/*}"

# load the config
source ../config/config.sh

# ensure host has docker installed
DOCKER_REQUIRED=$(hash docker 2>/dev/null)
if [[ ! -z $DOCKER_REQUIRED ]]; then
  curl -fsSL get.docker.com -o get-docker.sh | sh
  echo "-----------------------------------"
  echo "         DOCKER INSTALLED          "
  echo "-----------------------------------"
fi

# install certbot if required
CERTBOT_REQUIRED=$(hash certbot 2>/dev/null)
if [[ ! -z $CERTBOT_REQUIRED ]]; then
  apt-get update
  apt-get install software-properties-common
  add-apt-repository ppa:certbot/certbot
  apt-get update
  apt-get install certbot
  echo "-----------------------------------"
  echo "         CERTBOT INSTALLED         "
  echo "-----------------------------------"
fi

echo "..."