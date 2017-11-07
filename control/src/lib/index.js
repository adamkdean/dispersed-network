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
const amqp = require('amqplib/callback_api')
const util = require('./util.js')
const config = require('../config.js')

const hostname = os.hostname()
const serverPort = config.get('server.port')
const queueAddress = config.get('queue.address')
const defaultReconnectTimeout = config.get('queue.defaultReconnectTimeout')
const maxReconnectTimeout = config.get('queue.maxReconnectTimeout')

function Control() { }

Control.prototype.start = function () {
  // Initialise app for first time 
  if (!this._app) {
    this._jobs = this._jobs || {}
    this._app = express()
    this.configureRoutes()
    this._app.listen(serverPort, () => {
      console.log(`${hostname} listening on port ${serverPort}`)
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
    // TODO: this.listen()
  })
}

Control.prototype.configureRoutes = function () {
  const router = express.Router()
  
  router.use(availabilityMiddleware)
  router.get('/test', testMiddleware)
  
  this._app.use(router)
}

Control.prototype.testMiddleware = function (req, res, next) {
  res.send('control: hello world')
}

Control.prototype.availabilityMiddleware = function (req, res, next) {
  // If not connected/channel blocked, return 503 service unavailable
  if (!this._channel || this._serviceUnavailable) {
    return res.end(503)
  }
  
  next()
}

Control.prototype.connect = function (done) {
  amqp.connect(queueAddress, (err, connection) => {
    if (err) return done(err)
    connection.createChannel((err, channel) => {
      if (err) return done(err)

      this._connection = connection
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
  this._reconnectTimeoutInstance = setTimeout(this.start.bind(this), this._reconnectTimeout)
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

module.exports = exports = function () {
  const control = new Control()
  control.start()
}