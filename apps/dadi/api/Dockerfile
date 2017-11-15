FROM node:6.11
MAINTAINER Adam K Dean <akd@dadi.co>

RUN mkdir -p /var/api
WORKDIR /var/api

COPY src/package.json .
RUN npm install -q

COPY src .

CMD ["npm", "start"]