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
const bodyParser = require('body-parser')
const uuidv4 = require('uuid/v4')
const amqp = require('amqplib/callback_api')
const util = require('./util.js')
const routes = require('./routes.js')
const config = require('../config.js')

const hostname = os.hostname()
const serverPort = config.get('server.port')
const queueAddress = config.get('queue.address')
const exchangeName = config.get('queue.exchangeName')
const defaultReconnectTimeout = config.get('queue.defaultReconnectTimeout')
const maxReconnectTimeout = config.get('queue.maxReconnectTimeout')

function Control() { }

Control.prototype.start = function () {
  // Initialise app for first time
  if (!this._app) {
    this._app = express()
    this._app.use(bodyParser.json())
    this._app.use(routes(this))
    this._app.listen(serverPort, () => {
      console.log(`${hostname} (control) listening on port ${serverPort}`)
    })
  }
  
  // Connect to AMQP
  console.log('starting')
  this.connect((err) => {
    if (err) {
      console.log('connection failed')
      this.reconnect()
      return
    }

    // Bind to exchange, queue, etc
    console.log('connected, binding to exchange')
    this._reconnectTimeout = defaultReconnectTimeout
  })
}

Control.prototype.connect = function (done) {
  console.log('connecting to:', queueAddress)
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

Control.prototype.reconnect = function () {
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
  console.log(`reconnecting in ${this._reconnectTimeout} ms`)
  if (this._reconnectTimeoutInstance) clearTimeout(this._reconnectTimeoutInstance)
  this._reconnectTimeoutInstance = setTimeout(this.start.bind(this), this._reconnectTimeout)
}

Control.prototype.onConnectionError = function (err) {
  console.log('connection error', err)
  this.reconnect()
}

Control.prototype.onChannelClose = function () {
  console.log('channel closed')
  this.reconnect()
}

Control.prototype.onChannelError = function (err) {
  console.log('channel error', err)
  this.reconnect()
}

Control.prototype.onChannelBlocked = function () {
  console.log('channel is blocked')
  this._serviceUnavailable = true
}

Control.prototype.onChannelUnblocked = function () {
  console.log('channel is unblocked')
  this._serviceUnavailable = false
}

Control.prototype.publishMessage = function (key, msg, done) {
  if (!this._channel || this._serviceUnavailable) {
    return done({ msg: 'service unavailable' })
  }

  this._channel.assertExchange(exchangeName, 'topic', { durable: false })
  this._channel.publish(exchangeName, key, util.toBufferJSON(msg))
  return done()
}

Control.prototype.collectMessages = function (key, timeout, readyCallback, completeCallback) {
  let messages = []
  this._channel.assertExchange(exchangeName, 'topic', { durable: false })
  this._channel.assertQueue('', { exclusive: true }, (err, q) => {
    this._channel.bindQueue(q.queue, exchangeName, key)
    this._channel.consume(q.queue, (message) => messages.push({ data: message, received: Date.now() }), { noAck: true })
    
    readyCallback()
    setTimeout(() => {
      this._channel.unbindQueue(exchangeName, q.queue)
      completeCallback(messages)
    }, timeout)
  })  
}


module.exports = exports = function () {
  const control = new Control()
  control.start()
}