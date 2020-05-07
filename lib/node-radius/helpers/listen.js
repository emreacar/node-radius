import { createSocket } from 'dgram'

const errorMsg = require('debug')('error')
const infoMsg = require('debug')('info')


const listen = function(type, targetPort) {
  const socket = createSocket('udp4')

  socket.on('error', (err) => {
    errorMsg(`Error on ${type} socket:\n${err.message}`)
    socket.close()
  })

  socket.on('listening', () => {
    const { address, port } = socket.address()
    infoMsg(`${type} socket started on ${address}:${port}`)
  })

  socket.bind(targetPort)

  return socket
}

export default listen
