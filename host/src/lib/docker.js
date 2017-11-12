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

const _ = require('lodash')
const dockerode = require('dockerode')
const config = require('../config.js')

const registryDomain = config.get('registry.domain')
const registryAuth = {
  username: config.get('registry.user'),
  password: config.get('registry.pass'),
  auth: 'basic',
  serveraddress: `https://${registryDomain}/v2`
}


function Docker() {
  this._client = new dockerode()
}

Docker.prototype.getContainerImage = function (name) {
  return `${registryDomain}/${name}:latest`
}

Docker.prototype.getContainerInfo = function (name, done) {
  this._client.listContainers({ all: true }, (err, containers) => {
    if (err) {
      console.log('error listing containers', err)
      return done(err, null)
    }
    
    const container = _.find(containers, (container) => {
      return container.Names.indexOf(`/${name}`) > -1
    })
    
    done(null, container)
  })
}

Docker.prototype.startContainer = function (id) {
  const container = this._client.getContainer(id)
  container.start((err) => {
    if (err) {
      return console.log('error starting container:', id, err)
    }
  })
}

Docker.prototype.stopContainer = function (id) {
  const container = this._client.getContainer(id)
  container.stop((err) => {
    if (err) {
      return console.log('error stopping container:', id, err)
    }
  })
}

Docker.prototype.pullContainer = function (image, done) {
  console.log(`pulling ${image}...`)
  this._client.pull(image, { authconfig: registryAuth }, (err, stream) => {
    if (err) return done(err, null)
    this._client.modem.followProgress(stream, (err, output) => {
      if (err) return done(err, null)
      console.log(`${image} pulled`, ouput)
      return done(null, true)
    }, (event) => {
      console.log(`pulling ${image} progress...`, event)
    })
  })
}

Docker.prototype.runContainer = function (name) {
  const image = this.getContainerImage(name)
  this.pullContainer(image, (err, success) => {
    console.log(`${image} pulled, creating "${name}" container...`)
    this._client.createContainer({
      Image: image,
      name: name,
      RestartPolicy: {
        Name: 'on-failure',
        MaximumRetryCount: 5
      }
    }).then((container) => {
      container.start((err) => {
        if (err) return console.log(`error starting "${name}" container:`, err)
        console.log(`"${name}" container started`)
      })
    })
  })
}

module.exports = exports = new Docker()