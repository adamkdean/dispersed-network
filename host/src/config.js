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
    nickname: {
      doc: 'The nickname of the node',
      format: '*',
      default: 'no-name',
      env: 'NICKNAME'
    }
  },
  queue: {
    address: {
      doc: 'The address of the queue service',
      format: '*',
      default: 'amqp://dhttp-queue',
      env: 'QUEUE_ADDRESS'
    },
    exchangeName: {
      doc: 'The name of the exchange for jobs',
      format: '*',
      default: 'jobs',
      env: 'QUEUE_EXCHANGE_NAME'
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