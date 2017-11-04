'use strict'

const slugify = require('slugify')
const amqp = require('amqplib/callback_api')

const config = require('./config.js')
const queueAddress = config.get('queue.address')
const exchangeName = config.get('queue.exchangeName')

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
      channel.bindQueue(q.queue, exchangeName, 'request.*')
      channel.consume(q.queue, (msg) => {
        console.log(`\nconsume <-- ${exchangeName}: ${msg.fields.routingKey}: ${msg.content.toString()}`)
        
        const requestMsg = JSON.parse(msg.content.toString())
        const routingKey = `response.${slugify(requestMsg.hostname)}`
        const responseMsg = {
          id: requestMsg.id,
          response: `This is a test response for ${requestMsg.id}<br><br>Love from <em>${config.get('server.nickname')}</em>`
        }
        channel.publish(exchangeName, routingKey, toBufferJSON(responseMsg))
      })
    })
    
  })
})