import { listen, Request } from './helpers'
import { EventEmitter } from 'events'

const debugMsg = require('debug')('debug')
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
  }

  events = ['authorization', 'accounting'];

  addListener(eventName, callback) {
    eventEmitter.on(eventName, callback)
  }

  on(eventName, callback) {
    this.addListener(eventName, callback)
  }

  start() {
    this.events.forEach(type => {
      const socket = listen(type, this.options[type + 'Port'])

      socket.on('message', (msg, rinfo) => {
        const request = new Request(msg, rinfo)
        const response = {
          locals: {},
          send: function(data = '') {
            console.log('RESPONSE', data)
          }
        }

        eventEmitter.emit(type, request, response)
      })
    })
  }
}

export default Radius