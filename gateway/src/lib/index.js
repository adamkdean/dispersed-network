/*
   __   __  __  ___ __  __  ___ __
  |  \|/__`|__)|__ |__)/__`|__ |  \
  |__/|.__/|   |___|  \.__/|___|__/
              ______    __  __
         |\ ||__  ||  |/  \|__)|__/
         | \||___ ||/\|\__/|  \|  \

 dispersed network proof of concept
 (C) 2017 Adam K Dean <akd@dadi.co> */

'use strict'

const os = require('os')
const express = require('express')
const uuidv4 = require('uuid/v4')
const async = require('async')
const redis = require('redis')
const amqp = require('amqplib/callback_api')
const util = require('./util.js')
const config = require('../config.js')

const hostname = os.hostname()
const serverPort = config.get('server.port')
const responseTimeout = config.get('server.responseTimeout')
const queueAddress = config.get('queue.address')
const exchangeName = config.get('queue.exchangeName')
const defaultReconnectTimeout = config.get('queue.defaultReconnectTimeout')
const maxReconnectTimeout = config.get('queue.maxReconnectTimeout')
const redisAddress = config.get('redis.address')
const redisPassword = config.get('redis.password')

function Gateway() { }

Gateway.prototype.init = function () {
  this._jobs = {}
  this.initRedis()
  this.initExpress()
  this.initAppCache()
  this.initQueue()
}

Gateway.prototype.initRedis = function () {
  this._redis = redis.createClient({ host: redisAddress, password: redisPassword })
  this._redis.on('ready', this.onRedisReady.bind(this))
  this._redis.on('connect', this.onRedisConnect.bind(this))
  this._redis.on('reconnecting', this.onRedisReconnecting.bind(this))
  this._redis.on('error', this.onRedisError.bind(this))
  this._redis.on('end', this.onRedisEnd.bind(this))
}

Gateway.prototype.initExpress = function () {
  this._app = express()
  this._app.use(this.onHttpRequest.bind(this))
  this._app.listen(serverPort, () => {
    console.log(`${hostname} (control) listening on port ${serverPort}`)
  })
}

Gateway.prototype.initAppCache = function () {
  this._appCache = {}
  
  const refreshCache = function () {
    const tmpCache = {}
    this._redis.keys(`app.*`, (err, keys) => {
      async.map(keys, (key, callback) => {
        this._redis.get(key, (err, appData) => {
          if (err) return console.log(`error getting app data for ${key}`)
          const app = JSON.parse(appData)
          tmpCache[app.hostname] = app
          callback()
        })
      }, () => {
        this._appCache = tmpCache
        setTimeout(refreshCache.bind(this), 1000)
      })
    })
  }
  
  setTimeout(refreshCache.bind(this), 1000)
}

Gateway.prototype.initQueue = function () {
  console.log('connecting to queue')
  this.connect((err) => {
    if (err) {
      console.log('queue connection failed')
      this.reconnect()
      return
    }

    console.log('connected, binding to exchange')
    this._reconnectTimeout = defaultReconnectTimeout
    this.listen()
  })
}

Gateway.prototype.onRedisReady = function () {
  console.log('redis ready')
}

Gateway.prototype.onRedisConnect = function () {
  console.log('redis connected')
}

Gateway.prototype.onRedisReconnecting = function () {
  console.log('redis reconnecting')
}

Gateway.prototype.onRedisError = function (err) {
  console.log('redis error:', err.message)
}

Gateway.prototype.onRedisEnd = function () {
  console.log('redis connection closed')
}

Gateway.prototype.connect = function (done) {
  amqp.connect(queueAddress, (err, connection) => {
    if (err) return done(err)
    connection.createChannel((err, channel) => {
      if (err) return done(err)

      this._connection = connection
      this._connection.on('error', this.onConnectionError.bind(this))
      this._channel = channel
      this._channel.on('close', this.onChannelClose.bind(this))
      this._channel.on('error', this.onChannelError.bind(this))
      this._channel.on('blocked', this.onChannelBlocked.bind(this))
      this._channel.on('unblocked', this.onChannelUnblocked.bind(this))

      done()
    })
  })
}

Gateway.prototype.reconnect = function () {
  // Double the time we wait before reconnecting each time upto a maximum amount
  if (this._reconnectTimeout && this._reconnectTimeout <= maxReconnectTimeout) {
    if (this._reconnectTimeout * 2 < maxReconnectTimeout) {
      this._reconnectTimeout = this._reconnectTimeout * 2
    } else {
      this._reconnectTimeout = maxReconnectTimeout
    }
  } else {
    this._reconnectTimeout = defaultReconnectTimeout
  }

  // Attempt to reconnect, but use an instance so we don't fire multiple attempts
  console.log(`queue reconnecting in ${this._reconnectTimeout} ms`)
  if (this._reconnectTimeoutInstance) clearTimeout(this._reconnectTimeoutInstance)
  this._reconnectTimeoutInstance = setTimeout(this.initQueue.bind(this), this._reconnectTimeout)
}

Gateway.prototype.onConnectionError = function (err) {
  console.log('queue connection error', err)
  this.reconnect()
}

Gateway.prototype.onChannelClose = function () {
  console.log('queue channel closed')
  this.reconnect()
}

Gateway.prototype.onChannelError = function (err) {
  console.log('queue channel error', err)
  this.reconnect()
}

Gateway.prototype.onChannelBlocked = function () {
  console.log('queue channel is blocked')
  this._serviceUnavailable = true
}

Gateway.prototype.onChannelUnblocked = function () {
  console.log('queue channel is unblocked')
  this._serviceUnavailable = false
}

Gateway.prototype.listen = function () {
  // Assert topic exchange, create exclusive queue, and wait for responses
  this._channel.assertExchange(exchangeName, 'topic', { durable: false })
  this._channel.assertQueue('', { exclusive: true }, (err, q) => {
    this._channel.bindQueue(q.queue, exchangeName, 'response.*')
    this._channel.consume(q.queue, this.processMessage.bind(this), { noAck: true })
    console.log('listening for responses')
  })
}

Gateway.prototype.respondToJob = function (jobId, response, status) {
  const statusCode = status || 200
  const job = this._jobs[jobId]
  if (job) {
    console.log(`job ${jobId}: found`)
    if (job.response) {
      console.log(`job ${jobId}: sending response`)
      job.response.status(statusCode).send(response)
    }
    delete this._jobs[jobId]
  } else {
    console.log(`job ${jobId}: not found`)
  }
}

Gateway.prototype.processMessage = function (msg) {
  console.log(`\nconsume <-- ${exchangeName}: ${msg.fields.routingKey}: ${msg.content.toString()}`)

  const responseMsg = JSON.parse(msg.content.toString())
  const response = new Buffer(responseMsg.response, 'base64').toString('utf8')
  this.respondToJob(responseMsg.id, response)
}

Gateway.prototype.onHttpRequest = function (req, res) {
  // If not connected/channel blocked, return 503 service unavailable
  if (!this._channel || this._serviceUnavailable) {
    return res.status(503).send('service unavailable')
  }

  // Ensure we only accept requests for configured hostnames/running apps
  if (!this._appCache[req.hostname] || this._appCache[req.hostname].status !== 'running') {
    return res.status(404).send('not found')
  }

  // Construct request message and publish to exchange
  const app = this._appCache[req.hostname]
  const routingKey = `request.${app.name}`
  const requestMsg = {
    id: uuidv4(),
    hostname: req.hostname,
    headers: req.headers,
    url: req.url
  }

  // Store the req/res references for later so we can response
  this._jobs[requestMsg.id] = {
    request: req,
    response: res,
    requestMsg: requestMsg
  }

  console.log(`\npublish --> ${exchangeName}: ${routingKey} job:${requestMsg.id}`)
  this._channel.publish(exchangeName, routingKey, util.toBufferJSON(requestMsg))
  this.addResponseCatch(requestMsg.id)
}

Gateway.prototype.addResponseCatch = function (jobId) {
  setTimeout(() => {
    if (this._jobs[jobId]) {
      this.respondToJob(jobId, 'service unavailable', 503)
    }
  }, responseTimeout)
}

module.exports = exports = function () {
  const gateway = new Gateway()
  gateway.init()
}