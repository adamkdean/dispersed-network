'use strict'

const os = require('os')
const amqp = require('amqplib/callback_api')
const util = require('./util.js')
const config = require('../config.js')

const hostname = os.hostname()
const queueAddress = config.get('queue.address')
const exchangeName = config.get('queue.exchangeName')
const defaultReconnectTimeout = config.get('queue.defaultReconnectTimeout')
const maxReconnectTimeout = config.get('queue.maxReconnectTimeout')

function Host() { }

Host.prototype.start = function () {
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
    console.log('connected, listening for messages')
    this._reconnectTimeout = defaultReconnectTimeout
    this.listen()
  })
}

Host.prototype.connect = function (done) {
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

Host.prototype.reconnect = function () {
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

Host.prototype.onChannelClose = function () {
  console.log('channel closed')
  this.reconnect()
}

Host.prototype.onChannelError = function (err) {
  console.log('channel error', err)
  this.reconnect()
}

Host.prototype.onChannelBlocked = function () {
  console.log('channel is blocked')
  this._serviceUnavailable = true
}

Host.prototype.onChannelUnblocked = function () {
  console.log('channel is unblocked')
  this._serviceUnavailable = false
}

Host.prototype.listen = function () {
  //
  // Assert topic exchange, create exclusive queue, and wait for requests
  //
  this._channel.assertExchange(exchangeName, 'topic', { durable: false })
  this._channel.assertQueue('', { exclusive: true }, (err, q) => {
    this._channel.bindQueue(q.queue, exchangeName, 'request.*')
    this._channel.consume(q.queue, this.processMessage.bind(this), { noAck: true })
  })
}

Host.prototype.processMessage = function (msg) {
  console.log(`\nconsume <-- ${exchangeName}: ${msg.fields.routingKey}: ${msg.content.toString()}`)

  //
  // Here we are simply going to construct a response message and publish it
  //
  // We should in fact be working out if we want to handle it, and reconstructing
  // the HTTP request to a service running locally, and return that response
  // 
  const requestMsg = JSON.parse(msg.content.toString())
  const routingKey = `response.${util.toSlug(requestMsg.hostname)}`
  const responseMsg = {
    id: requestMsg.id,
    response: `This is a test response for requestId: ${requestMsg.id}<br><br>Served by <em>${hostname}</em>`
  }

  this._channel.publish(exchangeName, routingKey, util.toBufferJSON(responseMsg))
}

module.exports = exports = function () {
  const host = new Host()
  host.start()
}