FROM node:6.11
MAINTAINER Adam K Dean <akd@dadi.co>

RUN mkdir -p /var/cdn
WORKDIR /var/cdn

COPY src/package.json .
RUN npm install -q

COPY src .

CMD ["npm", "start"]