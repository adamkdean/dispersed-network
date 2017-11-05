FROM node:6.11
MAINTAINER Adam K Dean <akd@dadi.co>

RUN mkdir -p /var/dhttp/gateway
WORKDIR /var/dhttp/gateway

COPY src .
RUN npm install -q

CMD ["npm", "start"]