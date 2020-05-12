import Radius from './lib/node-radius'

const server = new Radius()

const clients = [
  { ip: '127.0.0.1', secret: 'secret', name: 'NAS 1' },
  { ip: '127.0.0.1', secret: 'secret', name: 'NAS 2' }
]

server.addClient(clients)

server.use((req, res, next) => {
  console.log('NABER LO?')
  next();
})

server.on('request', function(req, res, next) {
  console.log(req)
})

server.on('error', function(error) {
  console.log(error)
})

server.start()