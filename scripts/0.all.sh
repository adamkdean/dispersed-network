#!/bin/bash

echo "-----------------------------"
echo ""
echo " ▓▓▓   ▓  ▓ ▓▓▓▓▓ ▓▓▓▓▓ ▓▓▓  "
echo " ▓  ▓  ▓  ▓   ▓     ▓   ▓  ▓ "
echo " ▓  ▓  ▓▓▓▓   ▓     ▓   ▓▓▓  "
echo " ▓  ▓  ▓  ▓   ▓     ▓   ▓    "
echo " ▓▓▓   ▓  ▓   ▓     ▓   ▓    "
echo ""
echo "-----------------------------"

# set cwd to script path
cd "${0%/*}"

# run all scripts
./1.rmq.sh
./2.gateway.sh
./3.hosts.sh
