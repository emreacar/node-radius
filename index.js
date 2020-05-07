import Radius from './lib/node-radius'

const server = new Radius()

server.on('accounting', function(req, res) {
  console.log(req.data)
})

server.on('authorization', function(req, res) {
  console.log(req.data)
})

server.start()