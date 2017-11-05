# dhttp

Decentralised HTTP proof of concept

## Versions

### 0.4.0 (in progress)

- [x] Setup Docker registry service
- [x] SSL certificate for hub.akd.sh via letsencrypt
- [x] Auto-certificate generation &amp; renewal 
- [x] Add authentication to registry service 
- [ ] Setup Configuration service (Consul?)
- [ ] App configuration file (hostname etc) `Dhttpfile?`
- [ ] CLI package app/docker build etc
- [ ] CLI push app to registry
- [ ] CLI start/stop app command
- [ ] Gateway to only allow requests for configured domains 
- [ ] Hosts to deploy services on CLI start
- [ ] Hosts to remove services on CLI stop
- [ ] Hosts to recreate requests and query apps

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