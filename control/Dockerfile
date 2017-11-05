FROM node:6.11
MAINTAINER Adam K Dean <akd@dadi.co>

RUN mkdir -p /var/dhttp/control
WORKDIR /var/dhttp/control

COPY src .
RUN npm install -q

CMD ["npm", "start"]