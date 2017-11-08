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

const express = require('express')
const router = express.Router()

function testMiddleware(req, res, next) {
  res.send('control: hello world')
}

router.get('/test', testMiddleware)

module.exports = exports = router