'use strict'

const express = require('express')
const app = express()
const serverPort = process.env.PORT || 80

app.use(express.static('public'))
app.use((req, res) => {
  console.log('request incoming:', req.url)
  res.send('hello, this is a blog')
})

app.listen(serverPort, () => {
  console.log(`blog listening on port ${serverPort}`)
})