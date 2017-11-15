# dispersed-network

```
#   __   __  __  ___ __  __  ___ __
#  |  \|/__`|__)|__ |__)/__`|__ |  \
#  |__/|.__/|   |___|  \.__/|___|__/
#              ______    __  __
#         |\ ||__  ||  |/  \|__)|__/
#         | \||___ ||/\|\__/|  \|  \
#
# dispersed network proof of concept
# (C) 2017 Adam K Dean <akd@dadi.co>
```

## Hello world

See the [hello-world app](http://hello-world.dispersed.network/).

```
$ dn status
Name: hello-world
Status: running
Version: 7

HOST                  IMAGE      CREATED               STATUS                LATENCY
vaermina.disperse...  6f0d8b9    a few seconds ago     up 3 seconds          52 ms
sanguine.disperse...  6f0d8b9    a few seconds ago     up 3 seconds          52 ms
meridia.dispersed...  6f0d8b9    a few seconds ago     up 3 seconds          52 ms
```

## Intro

`Dispersed Network` is a proof of concept distributed serverless network comprised of custom `Control`, `Gateway`, and `Host` services, using `RabbitMQ (AMQP 0.9.1)`, `Redis 4.0`, `Docker Registry 2` services, and allowing the deploy and control of containerised serverless apps through the `dn` CLI tool.

## CLI

The `dn` CLI tool allows simple administration of applications on the network.

```
$ dn help

Usage: dn COMMAND

Commands:
  build       build application image
  create      create new application
  help        show usage
  list        list applications
  push        push application image to registry
  remove      remove application
  run         build, push, create, and start application
  start       start application
  status      show application status
  stop        stop application
  update      build, push, update application
  version     show version
```

### Hello World example app

Let's go through an example app. You can find the Dockerfile, App.config, and the Node.js application in the `apps/` directory of this repository.

1. Check there isn't already a `hello-world` app already running. App names are unique and cannot be shared.

```
$ dn list
APPLICATION                   CREATED               STATUS
blog (v4)                     a day ago             running
example (v1)                  a minute ago          running
```

2. Create the `App.config` file that provides app name/hostname configuration for our app. It is read by the CLI tool.

```
$ vi App.config

#
# hello-world example app config file
#
APP_NAME      hello-world
APP_HOSTNAME  hello-world.dispersed.network
```

3. Create the app (my layers were cached here because layered filesystems are awesome).

```
$ dn create
Sending build context to Docker daemon  156.7kB
Step 1/7 : FROM node:6.11
 ---> 8d51167c4089
Step 2/7 : MAINTAINER Adam K Dean <akd@dadi.co>
 ---> Using cache
 ---> a2a0fbf80969
Step 3/7 : RUN mkdir -p /var/hello-world
 ---> Using cache
 ---> d06bfb0dbb0e
Step 4/7 : WORKDIR /var/hello-world
 ---> Using cache
 ---> 22b0a47b0f70
Step 5/7 : COPY src .
 ---> Using cache
 ---> 09268a1adca3
Step 6/7 : RUN npm install -q
 ---> Using cache
 ---> 699b52ffc8ae
Step 7/7 : CMD npm start
 ---> Using cache
 ---> 6f0d8b9aefff
Successfully built 6f0d8b9aefff
Successfully tagged registry.dispersed.network/hello-world:latest
Login Succeeded
pushing registry.dispersed.network/hello-world
The push refers to a repository [registry.dispersed.network/hello-world]
cc33bc1d2d56: Layer already exists 
d8c781f56395: Layer already exists 
411cde64a269: Layer already exists 
ac07836ad41f: Layer already exists 
0e47e1433410: Layer already exists 
f08a91def194: Layer already exists 
317794bb275a: Layer already exists 
f11d21a6f426: Layer already exists 
f3ed6cb59ab0: Layer already exists 
654f45ecb7e3: Layer already exists 
2c40c66f7667: Layer already exists 
latest: digest: sha256:d10bcb62e88f7e72b9192b263142e4b804cf509b2e880ffa209add81bc0babfb size: 2634
hello-world (hello-world.dispersed.network) created
```

4. Check app status.

```
$ dn status
Name: hello-world
Status: created
Version: 1

HOST                  IMAGE      CREATED               STATUS                LATENCY
```

5. Start app.

```
$ dn start
hello-world (hello-world.dispersed.network) started
```

6. Check app status.

```
$ dn status
Name: hello-world
Status: running
Version: 1

HOST                  IMAGE      CREATED               STATUS                LATENCY
sanguine.disperse...  6f0d8b9    a few seconds ago     up 12 seconds         48 ms
meridia.dispersed...  6f0d8b9    a few seconds ago     up 12 seconds         49 ms
vaermina.disperse...  6f0d8b9    a few seconds ago     up 12 seconds         49 ms
```

(Bonus, check it our here: http://hello-world.dispersed.network/)

7. Stop the app.

```
$ dn stop
hello-world (hello-world.dispersed.network) stopped
```

8. Check app status.

```
$ dn status
Name: hello-world
Status: stopped
Version: 1

HOST                  IMAGE      CREATED               STATUS                LATENCY
vaermina.disperse...  6f0d8b9    a minute ago          exited (0) 15 sec...  50 ms
sanguine.disperse...  6f0d8b9    a minute ago          exited (0) 15 sec...  50 ms
meridia.dispersed...  6f0d8b9    a minute ago          exited (0) 15 sec...  50 ms
```

9. Remove app.

```
$ dn remove
hello-world removed
```

10. Check app status (for the last time).

```
$ dn status
hello-world not found
```

## Messages

Exchange: `dn`  
Request: `request.app-name`  
Response: `response.app-name`  
Update: `update.app-name`  
Start: `start.app-name`  
Stop: `stop.app-name`  
Remove: `remove.app-name`  

## Versions
 
### 0.5.0

- [ ] Setup example DADI API instance
- [ ] Setup example DADI CDN instance

### 0.4.0

- [x] Setup Docker registry service (registry.akd.sh)
- [x] SSL certificate for registry.akd.sh via letsencrypt
- [x] Auto-certificate generation &amp; renewal 
- [x] Add authentication to registry service 
- [x] Create example hello-world app
- [x] Setup key/value config service (redis)
- [x] App configuration file (hostname etc) `App.config`
- [x] Control service skeleton app
- [x] Control service 
- [x] CLI build
- [x] CLI help
- [x] CLI list
- [x] CLI push
- [x] CLI remove
- [x] CLI run
- [x] CLI start
- [x] CLI status
- [x] CLI update
- [x] CLI version
- [x] Gateway to only allow requests for configured domains 
- [x] Hosts to pull images + start (or restart stopped) services on CLI start
- [x] Hosts to stop services on CLI stop
- [x] Hosts to remove services on CLI remove
- [x] Hosts to pull new image + restart services on CLI update
- [x] Hosts to recreate requests and query apps
- [x] Response buffers stored in redis
- [x] Setup example DADI Web instance

### 0.3.0 

- [x] Refactor Host/Gateway into prototypal classes
- [x] Handle disconnects/reconnects gracefully
- [x] Shared configuration via in-repo config file

> Fig a.  
> Example 0.3.0 network topology

![Example 0.3.0 network topology](https://i.imgur.com/NqAbwym.png)

### 0.2.0

- [x] Gateway &amp Host now work remotely not just locally

### 0.1.0

- [x] Setup AMQP service (RabbitMQ)
- [x] Gateway service listen for HTTP requests
- [x] Gateway service publish requests to `jobs` exchange, topic `request.domain-com` etc
- [x] Host service listen for messages on `jobs` exchange, topic `request.*` etc
- [x] Host service send back abritrary response
- [x] Gateway service return abritrary response to client

## TODO (Eventually)

- [ ] Secure Queue with AMPQS/MQTTS/letsencrypt