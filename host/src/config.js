'use strict'

const convict = require('convict')

const config = convict({
  env: {
    doc: 'The applicaton environment',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV'
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
  },
  registry: {
    domain: {
      doc: 'The registry domain',
      format: '*',
      default: '',
      env: 'REGISTRY_DOMAIN'
    },
    user: {
      doc: 'The registry user',
      format: '*',
      default: '',
      env: 'REGISTRY_USER'
    },
    pass: {
      doc: 'The registry pass',
      format: '*',
      default: '',
      env: 'REGISTRY_PASS'
    }
  },
  redis: {
    address: {
      doc: 'The address of the redis service',
      format: '*',
      default: 'localhost',
      env: 'REDIS_ADDRESS'
    },
    password: {
      doc: 'The password of the redis service',
      format: '*',
      default: '',
      env: 'REDIS_PASSWORD'
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