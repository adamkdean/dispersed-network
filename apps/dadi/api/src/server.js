var server = require('@dadi/api')

// access the application configuration
var config = require('@dadi/api').Config
var log = require('@dadi/api').Log

server.run(function() {
 log.get().info('DADI API: Started')
})
