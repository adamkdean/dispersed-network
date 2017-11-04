'use strict'

const amqp = require('amqplib/callback_api')
const util = require('./util.js')
const config = require('../config.js')

slugify.extend({ '.': '-' })

function Host() {
  this.start()
}

Host.prototype.start = function () {
  this.connect((err) => {
    if (err) {
      console.log('[queue] connection failed')
      this.reconnect()
      return
    }
    
    this.bindToExchange()
  })
}

Host.prototype.connect = function () {
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
  channel.assertExchange(exchangeName, 'topic', { durable: false })
  channel.assertQueue('', { exclusive: true }, (err, q) => {
    channel.bindQueue(q.queue, exchangeName, 'request.*')
    channel.consume(q.queue, this.processMessage, { noAck: true })
  })
}

Host.prototype.processMessage = function (msg) {
  console.log(`\nconsume <-- ${exchangeName}: ${msg.fields.routingKey}: ${msg.content.toString()}`)
  
  const requestMsg = JSON.parse(msg.content.toString())
  const routingKey = `response.${util.slugify(requestMsg.hostname)}`
  const responseMsg = {
    id: requestMsg.id,
    response: `This is a test response for ${requestMsg.id}<br><br>Love from <em>${config.get('server.nickname')}</em>`
  }
  
  this._channel.publish(exchangeName, routingKey, util.toBufferJSON(responseMsg))
}

module.exports = exports = Host