'use strict'

const convict = require('convict')

const config = convict({
  env: {
    doc: 'The applicaton environment',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV'
  },
  server: {
    port: {
      doc: 'The port the application will bind to',
      format: 'port',
      default: 80,
      env: 'PORT'
    },
    responseTimeout: {
      doc: 'The how long to wait for a host response before respoding with 503 (in ms)',
      format: 'integer',
      default: 2500,
      env: 'RESPONSE_TIMEOUT'
    }
  },
  queue: {
    address: {
      doc: 'The address of the queue service',
      format: '*',
      default: 'amqp://dn-queue',
      env: 'QUEUE_ADDRESS'
    },
    exchangeName: {
      doc: 'The name of the message exchange',
      format: '*',
      default: 'dn',
      env: 'QUEUE_EXCHANGE_NAME'
    },
    defaultReconnectTimeout: {
      doc: 'The default initial time to wait before attempting to reconnect (in ms)',
      format: 'integer',
      default: 250,
      env: 'QUEUE_DEFAULT_RECONNECT_TIMEOUT'
    },
    maxReconnectTimeout: {
      doc: 'The maximum time to wait before attempting to reconnect (in ms)',
      format: 'integer',
      default: 5000,
      env: 'QUEUE_MAX_RECONNECT_TIMEOUT'
    }
  }
})

try {
  const env = config.get('env')
  config.loadFile('./config/config.' + env + '.json')
  config.validate({ allowed: true })
} catch (ex) {
  console.error(ex)
}

module.exports = config