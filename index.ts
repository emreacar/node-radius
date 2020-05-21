import Radius from './lib/node-radius'
import clients from './clients'

// const clients = [
//   { ip: '127.0.0.1', secret: 'secret', name: 'NAS-1' },
//   { ip: '185.224.3.83', secret: 'secret', name: 'NAS-2' }
// ]

const server = new Radius()

server.addClient(...clients)

server.use((req, res) => {
  console.log(req.data)
  res.reject(true)
})

server.start()
