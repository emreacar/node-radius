import { createSocket, Socket } from 'dgram'
import eventEmitter from './eventEmitter'
import { info } from './logger'

import { IHelpers } from '../types'

const listen: IHelpers.Listener<Socket> = (type, targetPort) => {
  const socket = createSocket('udp4')

  socket.on('error', err => {
    socket.close()

    eventEmitter.emit('error', `Socket Error: on ${type} socket \n${err.message}`)
  })

  socket.on('listening', () => {
    const { address, port } = socket.address()

    info(`${type} socket started on ${address}:${port}`)
  })

  socket.bind(targetPort)

  return socket
}

export default listen
