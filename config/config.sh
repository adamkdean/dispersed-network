#!/bin/bash
#
# ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
# ▓                                 ▓
# ▓   ▓▓▓   ▓  ▓ ▓▓▓▓▓ ▓▓▓▓▓ ▓▓▓    ▓
# ▓   ▓  ▓  ▓  ▓   ▓     ▓   ▓  ▓   ▓
# ▓   ▓  ▓  ▓▓▓▓   ▓     ▓   ▓▓▓    ▓
# ▓   ▓  ▓  ▓  ▓   ▓     ▓   ▓      ▓
# ▓   ▓▓▓   ▓  ▓   ▓     ▓   ▓      ▓
# ▓                                 ▓
# ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
#

#
# general configuration
#
DHTTP_VERSION="0.4.0-alpha"

#
# queue configuration
#
QUEUE_PROTOCOL="amqp" # amqps
QUEUE_HOSTNAME="gracious-gateway.akd.sh"
QUEUE_USERNAME="secretUser"
QUEUE_PASSWORD="tH1s15th3Secr3tp4ss"
QUEUE_VHOST="/dhttp"
QUEUE_PARAMS="?heartbeat=1"
export QUEUE_ADDRESS="$QUEUE_PROTOCOL://$QUEUE_USERNAME:$QUEUE_PASSWORD@$QUEUE_HOSTNAME/$QUEUE_VHOST$QUEUE_PARAMS"

#
# registry configuration
#
export REGISTRY_USER="dhttp"
export REGISTRY_PASS="k43i59udn2350idklm21"
export REGISTRY_EMAIL="akd@dadi.co"
export REGISTRY_DOMAIN="hub.akd.sh"

#
# redis configuration
#
export REDIS_ADDRESS="redis.akd.sh"
export REDIS_PASSWORD="1t5tand5f0rr3m0t3d1ct10narys3rv3r"