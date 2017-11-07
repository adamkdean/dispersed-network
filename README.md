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

## Messages

Exchange: `net`  
Request: `request.app-name`  
Response: `response.app-name`  
Update: `update.app-name`  
Start: `start.app-name`  
Stop: `stop.app-name`  
Restart: `restart.app-name`  
Remove: `remove.app-name`  

## TODO

- [ ] Control service skeleton app
- [ ] Control service 
- [x] CLI build
- [x] CLI help
- [ ] CLI list
- [x] CLI push
- [ ] CLI remove
- [ ] CLI restart
- [ ] CLI run
- [ ] CLI start
- [ ] CLI status
- [x] CLI version
- [ ] Gateway to only allow requests for configured domains 
- [ ] Hosts to deploy services on CLI start
- [ ] Hosts to remove services on CLI stop
- [ ] Hosts to recreate requests and query apps
- [ ] Secure Queue with AMPQS/MQTTS/letsencrypt

## Versions

### 0.4.0 (in progress)

- [x] Setup Docker registry service (registry.akd.sh)
- [x] SSL certificate for registry.akd.sh via letsencrypt
- [x] Auto-certificate generation &amp; renewal 
- [x] Add authentication to registry service 
- [x] Create example hello-world app
- [x] Setup key/value config service (redis)
- [x] App configuration file (hostname etc) `App.config`

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