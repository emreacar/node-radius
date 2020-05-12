import Radius from './lib/node-radius'

const debugMsg = require('debug')('debug')
const server = new Radius()

server.use((req, res, next) => {
  console.log('NABER LO?')
  next();
})

server.on('request', function(req, res, next) {
  console.log(req)
})

server.start()