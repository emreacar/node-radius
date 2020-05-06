import { createSocket } from 'dgram'

const sockets = [
  { type: 'auth', port: 1812 },
  { type: 'acc', port: 1813 }
]

function startSocket({ type = 'auth', port = 1812 } = {}) {
  const server = createSocket('udp4')

  server.on('error', (err) => {
    console.log(`error(${type}):\n${err.stack}`)
    server.close()
  })

  server.on('message', (msg, info) => {
    console.log(`coming(${type}):${msg} from ${info.address}:${info.port}`)
  })

  server.on('listening', () => {
    const address = server.address()
    console.log(`server listening(${type}): ${address.address}:${address.port}`)
  })

  server.bind(port)
}

sockets.forEach(socket => startSocket(socket))