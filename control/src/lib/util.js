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

const slugify = require('slugify')
const pad = require('pad')

function Util() {}

Util.prototype.toBufferJSON = function (object) {
  let msg = object
  try { msg = JSON.stringify(object) } 
  catch (e) { console.log('could not stringify object', e) }
  return new Buffer(msg)
}

Util.prototype.toSlug = function (string) {
  slugify.extend({ '.': '-' })
  return slugify(string)
}

Util.prototype.formatString = function (values, widths) {
  let output = ''
  for (let i = 0; i < values.length; i++) {
    const width = widths[i]
    const value = values[i].length > width - 2 ? values[i].substr(0, width - 5) + '...' : values[i]
    output += pad(value, width)
  }
  return output
}

module.exports = exports = new Util()