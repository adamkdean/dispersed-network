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

# install certbot if required
if ! [ -x "$(command -v certbot)" ]; then
  apt-get update
  apt-get install software-properties-common  -qy
  add-apt-repository ppa:certbot/certbot -y
  apt-get update
  apt-get install certbot -qy
  echo "-----------------------------------"
  echo "         CERTBOT INSTALLED         "
  echo "-----------------------------------"
fi

# create registry volume if required
REGISTRY_VOLUME_EXISTS=$(docker volume ls --format "{{.Name}}" | grep ^dn-registry-data$)
if [ -z $REGISTRY_VOLUME_EXISTS ]; then
  docker volume create \
    dn-registry-data
fi

# remove existing registry container if necessary
REGISTRY_EXISTS=$(docker ps -a --format "{{.Names}}" | grep ^dn-registry$)
if [[ ! -z $REGISTRY_EXISTS ]]; then
  docker stop dn-registry
  docker rm dn-registry
fi

read -p "Setup SSL certificate? [Y/N] " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  # generate SSL certificate for domain
  echo "generating ssl certificate (if required)..."
  certbot \
    certonly \
    --standalone \
    --keep-until-expiring \
    --email $REGISTRY_EMAIL \
    -d $REGISTRY_DOMAIN

  # setup letsencrypt certificates auto-renewal
  CRON_TEXT="30 2 * * 1 certbot renew >> /var/log/letsencrypt-renew.log"
  CRON_EXISTS=$(cat /etc/crontab | grep "$CRON_TEXT")
  if [ -z $CRON_EXISTS ]; then
    echo "adding letsencrypt certificates auto-renewal cron..."
    echo $CRON_TEXT >> /etc/crontab
  fi

  # rename SSL certificates
  echo "compiling certifiate key/crt files..."
  SSL_DIR="/etc/letsencrypt/live/$REGISTRY_DOMAIN"
  cp $SSL_DIR/privkey.pem $SSL_DIR/domain.key
  cat $SSL_DIR/cert.pem $SSL_DIR/chain.pem > $SSL_DIR/domain.crt
  chmod 777 $SSL_DIR/domain.crt $SSL_DIR/domain.key
  
  echo "-----------------------------------"
  echo "      SSL CERT SETUP COMPLETE      "
  echo "-----------------------------------"
fi

# generate the authentication file
docker run \
  --entrypoint htpasswd \
  registry:2 \
    -Bbn $REGISTRY_USER $REGISTRY_PASS > auth/htpasswd

# run docker registry
docker run \
  --name dn-registry \
  --volume /etc/letsencrypt/live/$REGISTRY_DOMAIN:/certs \
  --volume dn-registry-data:/var/lib/registry \
  --volume $(pwd)/auth:/auth \
  --env REGISTRY_AUTH=htpasswd \
  --env REGISTRY_AUTH_HTPASSWD_REALM="$REGISTRY_DOMAIN" \
  --env REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd \
  --env REGISTRY_HTTP_ADDR=0.0.0.0:443 \
  --env REGISTRY_HTTP_TLS_CERTIFICATE=/certs/domain.crt \
  --env REGISTRY_HTTP_TLS_KEY=/certs/domain.key \
  --publish 443:443 \
  --restart=always \
  --detach \
  registry:2

echo ""
docker ps | grep dn-registry
echo ""

echo "-----------------------------------"
echo "       REGISTRY CONTAINER UP       "
echo "-----------------------------------"