'use strict'

const express = require('express')
const app = express()
const serverPort = process.env.PORT || 80

app.use(express.static('public'))
app.use((req, res) => {
  console.log('request for', req.url)
  console.log('req.headers', req.headers)
  const name = req.query && req.query.name || 'no-name'
  const head = `<head><title>Hello world</title>`
  const body = `<body><h1>Hello world</h1><h2>Your name is ${name}</h2></body>`
  res.send(`<html>${head}${body}</html>`)
})

app.listen(serverPort, () => {
  console.log(`hello-world listening on port ${serverPort}`)
})