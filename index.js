import Radius from './lib/node-radius'

const debugMsg = require('debug')('debug')
const server = new Radius()

server.on('request', function(req, res) {
  debugMsg(req.data)
  debugMsg(req.data.AttributeList)
})

server.start()