var Event = function (req, res, data, callback) {
  data.global.timestamp = new Date().getTime()
  callback(null)
}

module.exports = function (req, res, data, callback) {
  return new Event(req, res, data, callback)
}
