import { createSocket } from 'dgram'
import eventEmitter from './eventEmitter'

const infoMsg = require('debug')('info')

const listen = function(type, targetPort) {
  const socket = createSocket('udp4')

  socket.on('error', (err) => {
    socket.close()

    eventEmitter.emit(
      'error',
      `Error on ${type} socket:\n${err.message}`
    )
  })

  socket.on('listening', () => {
    const { address, port } = socket.address()
    infoMsg(`${type} socket started on ${address}:${port}`)
  })

  socket.bind(targetPort)

  return socket
}

export default listen
