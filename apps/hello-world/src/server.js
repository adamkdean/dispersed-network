'use strict'

const express = require('express')
const app = express()
const serverPort = process.env.PORT || 80

app.use((req, res) => {
  req.send('hello world')
})

app.listen(serverPort, () => {
  console.log(`hello-world listening on port ${serverPort}`)
})