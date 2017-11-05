FROM node:6.11
MAINTAINER Adam K Dean <akd@dadi.co>

RUN mkdir -p /var/hello-world
WORKDIR /var/hello-world

COPY src .
RUN npm install -q

CMD ["npm", "start"]