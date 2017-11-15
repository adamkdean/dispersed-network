'use strict'

const express = require('express')
const app = express()
const serverPort = process.env.PORT || 80

app.use(express.static('public'))
app.use((req, res) => {
  console.log('request for', req.url)
  console.log('req.headers', req.headers)
  const name = req.query && req.query.name || 'no-name'
  const head = `<head><title>Hello world</title><style>body { background: #e1e1e1; }.hello-img { margin-top: 100px; }</style></head>`
  const body = `<body><center class="hello-img"><img width="600" src="/hello.png"></center></body>`
  res.send(`<html>${head}${body}</html>`)
})

app.listen(serverPort, () => {
  console.log(`hello-world listening on port ${serverPort}`)
})