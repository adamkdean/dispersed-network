FROM node:6.11
MAINTAINER Adam K Dean <akd@dadi.co>

RUN mkdir -p /var/dn/gateway
WORKDIR /var/dn/gateway

COPY src .
RUN npm install -q

CMD ["npm", "start"]