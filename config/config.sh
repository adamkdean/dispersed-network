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
# queue configuration
#
QUEUE_PROTOCOL="amqp" # amqps
QUEUE_HOSTNAME="gracious-gateway.akd.sh"
QUEUE_USERNAME="secretUser"
QUEUE_PASSWORD="tH1s15th3Secr3tp4ss"
QUEUE_VHOST="/dhttp"
QUEUE_PARAMS="?heartbeat=1"

# export the address which is all we need
export QUEUE_ADDRESS="$QUEUE_PROTOCOL://$QUEUE_USERNAME:$QUEUE_PASSWORD@$QUEUE_HOSTNAME/$QUEUE_VHOST$QUEUE_PARAMS"