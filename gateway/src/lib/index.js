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
const exchangeName = config.get('queue.exchangeName')
const defaultReconnectTimeout = config.get('queue.defaultReconnectTimeout')
const maxReconnectTimeout = config.get('queue.maxReconnectTimeout')

function Gateway() { }

Gateway.prototype.start = function () {
  //
  // Initialise app for first time 
  // 
  if (!this._app) {
    this._jobs = this._jobs || {}
    this._app = express()
    this._app.use(this.onHttpRequest.bind(this))
    this._app.listen(serverPort, () => {
      console.log(`dhttp-gateway listing on ${serverPort}`)
    })
  }
  
  //
  // Connect to AMQP
  // 
  console.log('starting')
  this.connect((err) => {
    if (err) {
      console.log('connection failed')
      this.reconnect()
      return
    }

    //
    // Bind to exchange, queue, etc
    // 
    console.log('connected, binding to exchange')
    this._reconnectTimeout = defaultReconnectTimeout
    this.listen()
  })
}

Gateway.prototype.connect = function (done) {
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

Gateway.prototype.reconnect = function () {
  //
  // Double the time we wait before reconnecting each time upto a maximum amount
  //
  if (this._reconnectTimeout && this._reconnectTimeout <= maxReconnectTimeout) {
    if (this._reconnectTimeout * 2 < maxReconnectTimeout) {
      this._reconnectTimeout = this._reconnectTimeout * 2
    } else {
      this._reconnectTimeout = maxReconnectTimeout
    }
  } else {
    this._reconnectTimeout = defaultReconnectTimeout
  }
  
  //
  // Attempt to reconnect, but use an instance so we don't fire multiple attempts
  //
  console.log(`reconnecting in ${this._reconnectTimeout} ms`)
  this._reconnectTimeoutInstance = setTimeout(this.start.bind(this), this._reconnectTimeout)
}

Gateway.prototype.onChannelClose = function () {
  console.log('channel closed')
  this.reconnect()
}

Gateway.prototype.onChannelError = function (err) {
  console.log('channel error', err)
  this.reconnect()
}

Gateway.prototype.onChannelBlocked = function () {
  console.log('channel is blocked')
  this._serviceUnavailable = true
}

Gateway.prototype.onChannelUnblocked = function () {
  console.log('channel is unblocked')
  this._serviceUnavailable = false
}

Gateway.prototype.listen = function () {
  //
  // Assert topic exchange, create exclusive queue, and wait for responses
  //
  this._channel.assertExchange(exchangeName, 'topic', { durable: false })
  this._channel.assertQueue('', { exclusive: true }, (err, q) => {
    this._channel.bindQueue(q.queue, exchangeName, 'response.*')
    this._channel.consume(q.queue, this.processMessage.bind(this), { noAck: true })
    console.log('listening for messages')
  })
}

Gateway.prototype.processMessage = function (msg) {
  console.log(`\nconsume <-- ${exchangeName}: ${msg.fields.routingKey}: ${msg.content.toString()}`)
  
  //
  // Pick up the job which holds the express req/res references and send back response
  // Any other messages for this will do nothing, this is the basis of quickest-response-wins
  // 
  const responseMsg = JSON.parse(msg.content.toString())
  if (this._jobs[responseMsg.id]) {
    this._jobs[responseMsg.id].response.send(responseMsg.response)
    delete this._jobs[responseMsg.id]
  }
}

Gateway.prototype.onHttpRequest = function (req, res) {
  //
  // If not connected/channel blocked, return 503 service unavailable
  //
  if (!this._channel || this._serviceUnavailable) {
    return res.end(503)
  }
  
  //
  // Construct request message and publish to exchange
  // 
  const routingKey = `request.${util.toSlug(req.hostname)}`
  const requestMsg = {
    id: uuidv4(),
    hostname: req.hostname,
    headers: req.headers,
    url: req.url
  }
  
  //
  // Store the req/res references for later so we can response
  // 
  this._jobs[requestMsg.id] = {
    request: req,
    response: res,
    requestMsg: requestMsg
  }
  
  console.log(`\npublish --> ${exchangeName}: ${routingKey} job:${requestMsg.id}`)
  this._channel.publish(exchangeName, routingKey, util.toBufferJSON(requestMsg))
}

module.exports = exports = function () {
  const gateway = new Gateway()
  gateway.start()
}