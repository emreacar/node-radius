import Radius from './lib/node-radius'

const debugMsg = require('debug')('debug')
const server = new Radius()

server.on('accounting', function(req, res) {
  debugMsg(req.data.AttributeList)
})

server.on('authorization', function(req, res) {
  debugMsg(req.data.AttributeList)
})

server.start()