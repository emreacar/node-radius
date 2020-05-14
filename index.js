import Radius from './lib/node-radius'

const server = new Radius()

const clients = [
  { ip: '127.0.0.1', secret: 'secret', name: 'NAS-1' },
  { ip: '192.168.1.2', secret: 'secret', name: 'NAS-2' }
]

server.addClient(clients)

server.on('request', function(req, res) {
  res.add('Framed-IP-Address', '192.168.1.1')
  res.send()
})

server.on('error', function(error) {
  console.log(error)
})

server.start()