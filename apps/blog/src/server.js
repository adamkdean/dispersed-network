'use strict'

const express = require('express')
const app = express()
const serverPort = process.env.PORT || 80

app.use((req, res) => {
  req.send('blog')
})

app.listen(serverPort, () => {
  console.log(`blog listening on port ${serverPort}`)
})