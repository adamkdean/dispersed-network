'use strict'

const slugify = require('slugify')

function Util() {}

Util.prototype.toBufferJSON(object) {
  let msg = object
  try { msg = JSON.stringify(object) } 
  catch (e) { console.log('could not stringify object', e) }
  return new Buffer(msg)
}

Util.prototype.toSlug(string) {
  slugify.extend({ '.': '-' })
  return slugify(string)
}

module.exports = exports = new Util()