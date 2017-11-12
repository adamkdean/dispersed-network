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

const redis = require('redis')
const express = require('express')
const async = require('async')
const moment = require('moment')
const config = require('../config.js')
const util = require('./util.js')

const router = express.Router()
const authToken = config.get('security.authToken')
const redisAddress = config.get('redis.address')
const redisPassword = config.get('redis.password')

function Routes() {}

Routes.prototype.init = function (control) {
  this._control = control
  this._redis = redis.createClient({ host: redisAddress, password: redisPassword })
  this._redis.on('ready', this.onRedisReady.bind(this))
  this._redis.on('connect', this.onRedisConnect.bind(this))
  this._redis.on('reconnecting', this.onRedisReconnecting.bind(this))
  this._redis.on('error', this.onRedisError.bind(this))
  this._redis.on('end', this.onRedisEnd.bind(this))
  
  this._router = express.Router()
  this._router.use(this.authorization.bind(this))
  this._router.get('/list', this.list.bind(this))
  this._router.get('/status/:name', this.status.bind(this))
  this._router.get('/start/:name', this.start.bind(this))
  this._router.get('/stop/:name', this.stop.bind(this))
  this._router.get('/remove/:name', this.remove.bind(this))
  this._router.post('/create', this.create.bind(this))
  this._router.post('/update', this.update.bind(this))
  this._router.use(this.notFound)
}

Routes.prototype.onRedisReady = function () {
  console.log('redis ready')
}

Routes.prototype.onRedisConnect = function () {
  console.log('redis connected')
}

Routes.prototype.onRedisReconnecting = function () {
  console.log('redis reconnecting')
}

Routes.prototype.onRedisError = function (err) {
  console.log('redis error:', err.message)
}

Routes.prototype.onRedisEnd = function () {
  console.log('redis connection closed')
}

Routes.prototype.notFound = function (req, res) {
  console.log('(404) not found', req.url)
  return res.status(404).send('not found')
}

Routes.prototype.authorization = function (req, res, next) {
  if (!req.headers || !req.headers.authorization || !req.headers.authorization === authToken) {
    console.log('(401) invalid authToken')
    return res.status(401).send('invalid token')
  }

  next()
}

Routes.prototype.status = function (req, res, next) {
  if (!req.params || !req.params.name) {
    console.log('(400) bad request')
    return res.status(400).send('bad request')
  }

  const name = req.params.name
  this._redis.get(`app.${name}`, (err, appData) => {
    if (err) return res.status(500).send('internal server error')
    if (appData === null) return res.status(404).send(`${name} not found`)

    const formatStatus = (host, image, created, status, latency) => {
      return util.formatString([host, image, created, status, latency], [22, 11, 22, 22, 10])
    }

    const timeout = 1000
    const app = JSON.parse(appData)
    let startTime = null
    let error = null

    // get ready to listen for messages, first callback fires once
    // the listener is ready, then we send messages, and second callback
    // fires after the timeout, in which we receive any collected messages
    this._control.collectMessages(`status-response.${name}`, timeout, () => {
      startTime = Date.now()
      this._control.publishMessage(`status.${name}`, {}, (err) => {
        if (err) {
          error = err
          return res.status(500).send('internal server error')
        }
      })
    }, (messages) => {
      console.log(`collecting msgs on 'status-response.${name}'`)

      const results = []
      results.push(formatStatus('HOST', 'IMAGE', 'CREATED', 'STATUS', 'LATENCY'))
      messages.forEach((msg) => {
        const msgObj = JSON.parse(msg.data.content.toString())
        const latency = moment.duration(msg.received - startTime).asMilliseconds()
        results.push(formatStatus(msgObj.hostname, msgObj.imageID.substr(0, 7), msgObj.created, msgObj.status, `${latency} ms`))
      })

      if (!error) {
        res.send(`Name: ${app.name}\nStatus: ${app.status}\nVersion: ${app.v}\n\n${results.join('\n')}`)
      }
    })
  })
}

Routes.prototype.list = function (req, res, next) {
  this._redis.keys(`app.*`, (err, keys) => {
    if (err) return res.status(500).send('internal server error')
    if (keys === null || keys.length === 0) return res.status(404).send('no applications found')

    const formatStatus = (app, created, status) => {
      return util.formatString([app, created, status], [30, 22, 22])
    }

    async.map(keys, (key, callback) => {
      this._redis.get(key, (err, appData) => {
        if (err) return callback(null, formatString(key, 'error getting app data'))
        const app = JSON.parse(appData)
        const createdDate = moment(app.created).fromNow()
        callback(null, formatStatus(`${app.name} (v${app.v})`, createdDate, app.status))
      })
    }, (err, results) => {
      results.unshift(formatStatus('APPLICATION', 'CREATED', 'STATUS'))
      res.send(results.join('\n'))
    })
  })
}

Routes.prototype.start = function (req, res, next) {
  if (!req.params || !req.params.name) {
    console.log('(400) bad request')
    return res.status(400).send('bad request')
  }

  const name = req.params.name
  this._redis.get(`app.${name}`, (err, appData) => {
    if (err) return res.status(500).send('internal server error')
    if (appData === null) return res.status(404).send(`${name} not found`)

    const app = JSON.parse(appData)
    if (app.status === 'running') 
      return res.send(`${app.name} (${app.hostname}) already running`)

    this._control.publishMessage(`start.${name}`, {}, (err) => {
      if (err) return res.status(500).send('internal server error')

      this._redis.set(`app.${name}`, JSON.stringify(Object.assign({}, app, {
        status: 'running'
      })), (err, result) => {
        if (err) return res.status(500).send('internal server error')
        res.send(`${app.name} (${app.hostname}) started`)
      })
    })
  })
}

Routes.prototype.stop = function (req, res, next) {
  if (!req.params || !req.params.name) {
    console.log('(400) bad request')
    return res.status(400).send('bad request')
  }

  const name = req.params.name
  this._redis.get(`app.${name}`, (err, appData) => {
    if (err) return res.status(500).send('internal server error')
    if (appData === null) return res.status(404).send(`${name} not found`)

    const app = JSON.parse(appData)
    if (app.status !== 'running')
      return res.send(`${app.name} (${app.hostname}) not running`)

    this._control.publishMessage(`stop.${name}`, {}, (err) => {
      if (err) return res.status(500).send('internal server error')

      this._redis.set(`app.${name}`, JSON.stringify(Object.assign({}, app, {
        status: 'stopped'
      })), (err, result) => {
        if (err) return res.status(500).send('internal server error')
        res.send(`${app.name} (${app.hostname}) stopped`)
      })
    })
  })
}

Routes.prototype.remove = function (req, res, next) {
  if (!req.params || !req.params.name) {
    console.log('(400) bad request')
    return res.status(400).send('bad request')
  }

  const name = req.params.name
  this._redis.get(`app.${name}`, (err, appData) => {
    if (err) return res.status(500).send('internal server error')
    if (appData === null) return res.status(404).send(`${name} not found`)

    this._control.publishMessage(`remove.${name}`, {}, (err) => {
      if (err) return res.status(500).send('internal server error')
      this._redis.del(`app.${name}`)
      res.send(`${name} removed`)
    })
  })
}

Routes.prototype.create = function (req, res, next) {
  if (!req.body || !req.body.name || !req.body.hostname) {
    console.log('(400) bad request')
    return res.status(400).send('bad request')
  }

  const name = req.body && req.body.name
  const hostname = req.body && req.body.hostname

  this._redis.get(`app.${name}`, (err, appData) => {
    if (err) return res.status(500).send('internal server error')
    if (appData !== null) return res.status(303).send(`${name} already exists`)

    this._redis.set(`app.${name}`, JSON.stringify({
      name: name,
      hostname: hostname,
      status: 'created',
      created: Date.now(),
      v: 1,
    }), (err, result) => {
      if (err) return res.status(500).send('internal server error')
      res.send(`${name} (${hostname}) created`)
    })
  })
}

Routes.prototype.update = function (req, res, next) {
  if (!req.body || !req.body.name || !req.body.hostname) {
    console.log('(400) bad request')
    return res.status(400).send('bad request')
  }

  const name = req.body && req.body.name
  const hostname = req.body && req.body.hostname

  this._redis.get(`app.${name}`, (err, appData) => {
    if (err) return res.status(500).send('internal server error')
    if (appData === null) return res.status(404).send(`${name} not found`)

    const app = JSON.parse(appData)
    this._control.publishMessage(`update.${name}`, {}, (err) => {
      if (err) return res.status(500).send('internal server error')
      this._redis.set(`app.${name}`, JSON.stringify(Object.assign({}, app, {
        name: name,
        hostname: hostname,
        updated: Date.now(),
        v: app.v + 1
      })), (err, result) => {
        if (err) return res.status(500).send('internal server error')
        res.send(`${name} (${hostname}) updated`)
      })
    })
  })
}

module.exports = exports = function (control) {
  const routes = new Routes()
  routes.init(control)
  return routes._router
}