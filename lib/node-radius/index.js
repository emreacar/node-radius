import { listen, Request, Dictionary } from './helpers'
import { EventEmitter } from 'events'

const eventEmitter = new EventEmitter()

class Radius {
  constructor(customOptions = {}) {
    this.options = {
      authorizationPort : 1812,
      accountingPort : 1813,
      ...customOptions
    }

    if (this.options.authorizationPort === this.options.accountingPort) {
      throw new TypeError('Auhotization and Accounting Ports must be different.')
    }

    /** Todo: Add Dictionary To middleware after */
    Dictionary.load()
  }

  addListener(eventName, callback) {
    eventEmitter.on(eventName, callback)
  }

  on(eventName, callback) {
    this.addListener(eventName, callback)
  }

  sockets = ['authorization', 'accounting']

  start() {
    this.sockets.forEach(type => {
      const socket = listen(type, this.options[type + 'Port'])

      socket.on('message', (msg, rinfo) => {
        const request = new Request(msg, rinfo)
        const response = {
          locals: {},
          send: function(data = '') {
            console.log('RESPONSE', data)
          }
        }

        eventEmitter.emit('request', request, response)
      })
    })
  }
}

export default Radius