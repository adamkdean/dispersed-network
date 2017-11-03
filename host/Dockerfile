FROM node:6.11
MAINTAINER Adam K Dean <akd@dadi.co>

RUN mkdir -p /var/dhttp/host
WORKDIR /var/dhttp/host

COPY src .
RUN npm install

CMD ["npm", "start"]