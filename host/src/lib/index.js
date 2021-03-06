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

const _ = require('lodash')
const os = require('os')
const redis = require('redis')
const moment = require('moment')
const request = require('request')
const through2 = require('through2')
const streamBuffers = require('stream-buffers')
const amqp = require('amqplib/callback_api')
const util = require('./util.js')
const docker = require('./docker.js')
const config = require('../config.js')

const hostname = os.hostname()
const queueAddress = config.get('queue.address')
const exchangeName = config.get('queue.exchangeName')
const defaultReconnectTimeout = config.get('queue.defaultReconnectTimeout')
const maxReconnectTimeout = config.get('queue.maxReconnectTimeout')
const redisAddress = config.get('redis.address')
const redisPassword = config.get('redis.password')

function Host() { }

Host.prototype.init = function () {
  this.initRedis()
  this.initQueue()
}

Host.prototype.initRedis = function () {
  this._redis = redis.createClient({ host: redisAddress, password: redisPassword })
  this._redis.on('ready', this.onRedisReady.bind(this))
  this._redis.on('connect', this.onRedisConnect.bind(this))
  this._redis.on('reconnecting', this.onRedisReconnecting.bind(this))
  this._redis.on('error', this.onRedisError.bind(this))
  this._redis.on('end', this.onRedisEnd.bind(this))
}

Host.prototype.onRedisReady = function () {
  console.log('redis ready')
}

Host.prototype.onRedisConnect = function () {
  console.log('redis connected')
}

Host.prototype.onRedisReconnecting = function () {
  console.log('redis reconnecting')
}

Host.prototype.onRedisError = function (err) {
  console.log('redis error:', err.message)
}

Host.prototype.onRedisEnd = function () {
  console.log('redis connection closed')
}

Host.prototype.initQueue = function () {
  // Connect to AMQP
  console.log('connecting to queue')
  this.connect((err) => {
    if (err) {
      console.log('queue connection failed')
      this.reconnect()
      return
    }

    // Bind to exchange, queue, etc
    console.log('connected, binding to exchange')
    this._reconnectTimeout = defaultReconnectTimeout
    
    this.bindFunctionToRoutingKey('status.*', this.onStatus.bind(this))
    this.bindFunctionToRoutingKey('start.*', this.onStart.bind(this))
    this.bindFunctionToRoutingKey('stop.*', this.onStop.bind(this))
    this.bindFunctionToRoutingKey('remove.*', this.onRemove.bind(this))
    this.bindFunctionToRoutingKey('update.*', this.onUpdate.bind(this))
    this.bindFunctionToRoutingKey('request.*', this.onRequest.bind(this))
  })
}

Host.prototype.connect = function (done) {
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

Host.prototype.reconnect = function () {
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

Host.prototype.onConnectionError = function (err) {
  console.log('queue connection error', err)
  this.reconnect()
}

Host.prototype.onChannelClose = function () {
  console.log('queue channel closed')
  this.reconnect()
}

Host.prototype.onChannelError = function (err) {
  console.log('queue channel error', err)
  this.reconnect()
}

Host.prototype.onChannelBlocked = function () {
  console.log('queue channel is blocked')
  this._serviceUnavailable = true
}

Host.prototype.onChannelUnblocked = function () {
  console.log('queue channel is unblocked')
  this._serviceUnavailable = false
}

Host.prototype.bindFunctionToRoutingKey = function (routingKey, fn) {
  // Assert topic exchange, create exclusive queue, and wait for requests
  this._channel.assertExchange(exchangeName, 'topic', { durable: false })
  this._channel.assertQueue('', { exclusive: true }, (err, q) => {
    this._channel.bindQueue(q.queue, exchangeName, routingKey)
    this._channel.consume(q.queue, fn, { noAck: true })
    console.log(`queue bound to ${routingKey}`)
  })
}

Host.prototype.onStatus = function (msg) {
  console.log(`\nconsume <-- ${exchangeName}: ${msg.fields.routingKey}: ${msg.content.toString()}`)

  const name = msg.fields.routingKey.split('.')[1]
  const routingKey = `status-response.${name}`
  docker.getContainerInfo(name, (err, info) => {
    if (info) {
      const response = {
        hostname: hostname,
        status: info.Status.toLowerCase(),
        created: moment.unix(info.Created).fromNow(),
        imageID: info.ImageID.split(':')[1]
      }
      this._channel.publish(exchangeName, routingKey, util.toBufferJSON(response))
    }
  })
}

Host.prototype.onStart = function (msg) {
  console.log(`\nconsume <-- ${exchangeName}: ${msg.fields.routingKey}: ${msg.content.toString()}`)

  const name = msg.fields.routingKey.split('.')[1]
  docker.getContainerInfo(name, (err, info) => {
    if (!err) {
      if (info && info.State !== 'running') {
        console.log(`starting container ${info.Id} (previously ${info.State})`)
        docker.startContainer(info.Id)
      } else if (!info) {
        console.log(`running container with name ${name}`)
        docker.runContainer(name)
      }
    }
  })
}

Host.prototype.onStop = function (msg) {
  console.log(`\nconsume <-- ${exchangeName}: ${msg.fields.routingKey}: ${msg.content.toString()}`)

  const name = msg.fields.routingKey.split('.')[1]
  docker.getContainerInfo(name, (err, info) => {
    if (!err) {
      if (info && info.State === 'running') {
        console.log(`stopping container ${info.Id}`)
        docker.stopContainer(info.Id)
      }
    }
  })
}

Host.prototype.onRemove = function (msg) {
  console.log(`\nconsume <-- ${exchangeName}: ${msg.fields.routingKey}: ${msg.content.toString()}`)

  const name = msg.fields.routingKey.split('.')[1]
  docker.getContainerInfo(name, (err, info) => {
    if (!err && info) {
      if (info.State === 'running') {
        console.log(`stopping container ${info.Id}`)
        docker.stopContainer(info.Id, () => {
          docker.removeContainer(info.Id)
        })
      } else {
        docker.removeContainer(info.Id)
      }
    }
  })
}

Host.prototype.onUpdate = function (msg) {
  console.log(`\nconsume <-- ${exchangeName}: ${msg.fields.routingKey}: ${msg.content.toString()}`)

  const name = msg.fields.routingKey.split('.')[1]
  docker.getContainerInfo(name, (err, info) => {
    if (!err && info) {
      const image = docker.getContainerImage(name)
      docker.pullContainerImage(image, (err, success) => {
        if (err) return console.log(`failed to pull ${name} image`, err)
        if (info.State === 'running') {
          console.log(`stopping container ${info.Id}`)
          docker.stopContainer(info.Id, () => {
            docker.removeContainer(info.Id, () => {
              console.log(`running container with name ${name}`)
              docker.runContainer(name)
            })
          })
        } else {
          docker.removeContainer(info.Id, () => {
            console.log(`running container with name ${name}`)
            docker.runContainer(name)
          })
        }
      })
    }
  })
}

Host.prototype.onRequest = function (msg) {
  console.log(`\nconsume <-- ${exchangeName}: ${msg.fields.routingKey}: ${msg.content.toString()}`)

  const name = msg.fields.routingKey.split('.')[1]
  const requestMsg = JSON.parse(msg.content.toString())

  docker.getContainerInfo(name, (err, info) => {
    if (!err) {
      if (info && info.State === 'running') {
        
        // remove this stupid header which is breaking CDN
        delete requestMsg.headers['if-none-match']
        
        const stream = new streamBuffers.WritableStreamBuffer()
        const responseKey = Math.random().toString(36).substr(2)
        const containerIP = docker.getContainerIP(info)
        const requestInstance = request({
          url: `http://${containerIP}${requestMsg.url}`,
          headers: Object.assign({}, requestMsg.headers, {
            'pragma': 'no-cache',
            'cache-control': 'no-cache'
          })
        })

        let statusCode = null
        let headers = null

        requestInstance.pipe(
          through2(function (chunk, enc, callback) {
            stream.write(chunk)
            callback()
          })
        )

        requestInstance.on('error', (error) => {
          console.log('error processing request', error)
        })

        requestInstance.on('response', (response) => {
          statusCode = response.statusCode
          headers = response.headers
        })

        requestInstance.on('end', () => {
          const routingKey = `response.${util.toSlug(requestMsg.hostname)}`
          const responseMsg = {
            id: requestMsg.id,
            status: statusCode,
            headers: headers,
            responseKey: responseKey
          }

          const contents = stream.getContents()
          const base64 = contents.toString('base64')
          this._redis.set(responseKey, base64, 'EX', 60, (error) => {
            if (error) return console.log('error saving reponse to redis', error)
            this._channel.publish(exchangeName, routingKey, util.toBufferJSON(responseMsg))
          })
        })
      }
    }
  })
}

module.exports = exports = function () {
  const host = new Host()
  host.init()
}