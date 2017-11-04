'use strict'

const express = require('express')
const slugify = require('slugify')
const uuidv4 = require('uuid/v4')
const amqp = require('amqplib/callback_api')

const config = require('./config.js')
const serverPort = config.get('server.port')
const queueAddress = config.get('queue.address')
const exchangeName = config.get('queue.exchangeName')

const app = express()
const jobs = {}

slugify.extend({ '.': '-' })

function toBufferJSON(object) {
  let msg = object
  try { msg = JSON.stringify(object) }
  catch (e) { console.log('could not stringify object', e) }
  return new Buffer(msg)
}

amqp.connect(queueAddress, (err, connection) => {
  if (err) console.error(err)
  connection.createChannel((err, channel) => {
    if (err) console.error(err)
    
    channel.assertExchange(exchangeName, 'topic', { durable: false })
    channel.assertQueue('', { exclusive: true }, (err, q) => {
      channel.bindQueue(q.queue, exchangeName, 'response.*')
      channel.consume(q.queue, (msg) => {
        console.log(`\nconsume <-- ${exchangeName}: ${msg.fields.routingKey}: ${msg.content.toString()}`)
        
        const responseMsg = JSON.parse(msg.content.toString())
        if (jobs[responseMsg.id]) {
          console.log('\nhere we would send', responseMsg.response)
          jobs[responseMsg.id].response.send(responseMsg.response)
          delete jobs[responseMsg.id]
        }
      })
    })
    
    app.use((req, res) => {
      const routingKey = `request.${slugify(req.hostname)}`
      const requestMsg = {
        id: uuidv4(),
        hostname: req.hostname,
        headers: req.headers,
        url: req.url
      }
      
      jobs[requestMsg.id] = {
        request: req,
        response: res,
        requestMsg: requestMsg
      }
      
      console.log(`\npublish --> ${exchangeName}: ${routingKey} job:${requestMsg.id}`)
      channel.publish(exchangeName, routingKey, toBufferJSON(requestMsg))
    }, { noAck: true })
    
    app.listen(serverPort, () => {
      console.log(`dhttp-gateway listing on ${serverPort}`)
    })
  })
})