'use strict'

const amqp = require('amqplib/callback_api')
const util = require('./util.js')
const config = require('../config.js')

function Host() { }

Host.prototype.start = function () {
  console.log('[host] starting...')
  this.connect((err) => {
    if (err) {
      console.log('[queue] connection failed')
      this.reconnect()
      return
    }

    console.log('[host] binding to exchange...')
    this.bindToExchange()
  })
}

Host.prototype.connect = function (done) {
  const queueAddress = config.get('queue.address')
  amqp.connect(queueAddress, (err, connection) => {
    if (err) return console.log('amqp.connect error:', err)
    connection.createChannel((err, channel) => {
      if (err) return console.log('connection.createChannel error:', err)

      this._connection = connection
      this._channel = channel
      this._channel.on('close', this.onChannelClose)
      this._channel.on('error', this.onChannelError)
      this._channel.on('blocked', this.onChannelBlocked)
      this._channel.on('unblocked', this.onChannelUnblocked)

      done()
    })
  })
}

Host.prototype.reconnect = function () {
  const defaultReconnectTimeout = config.get('queue.defaultReconnectTimeout')
  const maxReconnectTimeout = config.get('queue.maxReconnectTimeout')

  if (this._reconnectTimeout && this._reconnectTimeout < maxReconnectTimeout) {
    this._reconnectTimeout = this._reconnectTimeout * 2
  } else {
    this._reconnectTimeout = defaultReconnectTimeout
  }

  console.log(`[queue] reconnecting in ${this._reconnectTimeout} ms`)
  this._reconnectTimeoutInstance = setTimeout(this.start, this._reconnectTimeout)
}

Host.prototype.onChannelClose = function () {
  console.log('[queue] channel closed')
  this.reconnect()
}

Host.prototype.onChannelError = function (err) {
  console.log('[queue] channel error', err)
  this.reconnect()
}

Host.prototype.onChannelBlocked = function () {
  console.log('[queue] channel is blocked')
}

Host.prototype.onChannelUnblocked = function () {
  console.log('[queue] channel is unblocked')
}

Host.prototype.bindToExchange = function () {
  const exchangeName = config.get('queue.exchangeName')
  this._channel.assertExchange(exchangeName, 'topic', { durable: false })
  this._channel.assertQueue('', { exclusive: true }, (err, q) => {
    this._channel.bindQueue(q.queue, exchangeName, 'request.*')
    this._channel.consume(q.queue, this.processMessage.bind(this), { noAck: true })
  })
}

Host.prototype.processMessage = function (msg) {
  const exchangeName = config.get('queue.exchangeName')
  console.log(`\nconsume <-- ${exchangeName}: ${msg.fields.routingKey}: ${msg.content.toString()}`)

  const requestMsg = JSON.parse(msg.content.toString())
  const routingKey = `response.${util.toSlug(requestMsg.hostname)}`
  const responseMsg = {
    id: requestMsg.id,
    response: `This is a test response for ${requestMsg.id}<br><br>Love from <em>${config.get('server.nickname')}</em>`
  }

  this._channel.publish(exchangeName, routingKey, util.toBufferJSON(responseMsg))
}

module.exports = exports = function () {
  const host = new Host()
  host.start()
}