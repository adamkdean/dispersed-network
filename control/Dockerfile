FROM node:6.11
MAINTAINER Adam K Dean <akd@dadi.co>

RUN mkdir -p /var/dn/control
WORKDIR /var/dn/control

COPY src .
RUN npm install -q

CMD ["npm", "start"]