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

#
# general configuration
#
export DHTTP_VERSION="0.4.0-alpha"

#
# control configuration
#
export CONTROL_ADDRESS="control.akd.sh"
export CONTROL_AUTH_TOKEN="token_0ff1331d33475595e2f84dc3ff5f1aa70c46c9a6"

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
export REGISTRY_DOMAIN="registry.akd.sh"

#
# redis configuration
#
export REDIS_ADDRESS="redis.akd.sh"
export REDIS_PASSWORD="1t5tand5f0rr3m0t3d1ct10narys3rv3r"