# dhttp

Decentralised HTTP proof of concept

## Versions

### TODO

- [ ] CLI build
- [x] CLI help
- [ ] CLI list
- [ ] CLI push
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

### 0.4.0 (in progress)

- [x] Setup Docker registry service
- [x] SSL certificate for hub.akd.sh via letsencrypt
- [x] Auto-certificate generation &amp; renewal 
- [x] Add authentication to registry service 
- [x] Create example hello-world app
- [x] Setup key/value config service (redis)
- [x] App configuration file (hostname etc) `Dhttpfile?`

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