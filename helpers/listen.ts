import { createSocket, Socket } from 'dgram'
import eventEmitter from './eventEmitter'
import { IHelpers } from '../types'

const activeListeners = {}

export const listen: IHelpers.Listener<Socket> = (type, targetPort) => {
  const socket = createSocket('udp4')

  socket.on('error', err => {
    socket.close()

    eventEmitter.emit(
      'logger',
      'error',
      `Socket Error: on ${type} socket \n${err.message}`
    )
  })

  socket.on('listening', () => {
    const { address, port } = socket.address()

    eventEmitter.emit('logger', 'info', `${type} socket started on ${address}:${port}`)
  })

  socket.on('message', (buffer, rinfo) => {
    eventEmitter.emit('sockMessage', socket, buffer, rinfo)
  })

  socket.bind(targetPort)
  activeListeners[type] = socket

  return socket
}

export const getSock = (type: string) => activeListeners[type]

export default { listen, getSock }
