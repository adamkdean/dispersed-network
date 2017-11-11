FROM node:6.11
MAINTAINER Adam K Dean <akd@dadi.co>

RUN mkdir -p /var/blog
WORKDIR /var/blog

COPY src .
RUN npm install -q

CMD ["npm", "start"]