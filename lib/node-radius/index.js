import { listen, Request, Dictionary } from './helpers'
import { EventEmitter } from 'events'

const eventEmitter = new EventEmitter()
const debugErr = require('debug')('error')


/**
 * @todo
 * [-] More Effective Clients Management
 * [-] Response Class
 * [-] More Effective Attribute Class
 * [-] Logger Class
 * [-] Response, Request Relations with Attributes
 * [-] VSA for Dictionary
 */

class Radius {
  constructor(customOptions = {}) {
    this.options = {
      authorizationPort : 1812,
      accountingPort : 1813,
      ...customOptions
    }

    eventEmitter.on('error', error => {
      debugErr('Error On Init:', error)
    })

    if (this.options.authorizationPort === this.options.accountingPort) {
      eventEmitter.emit('error', 'Auhotization and Accounting Ports must be different.')
      process.exit(0)
    }

    /** Todo: Add Dictionary To middleware after */
    Dictionary.load()

    this._clients = new Map()
    this._handlers = []

    this._customEvents = ['error']
  }
  /**
   *
   * @param {Object|Array} clients
   * @description Parameter must be a single client object or multiple array includes client Object
   * @model { ip: String|required, secret: String|required, name: String|optional }
   * @example addClient({ip: 192.168.1.1, secret: 'secret'})
   * @example addClient([{client}, {client} ...])
   */
  addClient(clients) {
    if (typeof clients !== 'array' && typeof clients !== 'object') {
      eventEmitter.emit('error', 'Client Parameter must be and array or object')
      process.exit(0)
    } else if (Array.isArray(clients)) {
      for(let client of clients) {
        this._clients.set(client.ip, client)
      }
    } else if(typeof clients !== 'object') {
      this._clients.set(clients.ip, clients)
    } else {
      eventEmitter.emit('error', 'Client Parameter must be and array or object includes in clients model')
      process.exit(0)
    }
  }

  on(eventName, callback) {
    if (typeof eventName === 'string') {

      if (!this._customEvents.includes(eventName)) {
        this.addListener(eventName, callback)
      }

      this._handlers.push(eventName)
    }
  }

  runHandlers(req, res, next) {
    const _handler = this._handlers.reduceRight((next, fn) => () => {
      if (typeof fn === 'function') {
        fn(req, res, next)
      } else if(typeof fn === 'string') {
        eventEmitter.emit(fn, req, res, next)
      }
    }, next)

    _handler(req, res)
  }

  addListener(eventName, callback) {
    eventEmitter.on(eventName, callback)
  }

  /**
   *
   * @param {Function} middleware
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      eventEmitter.emit('error', 'Middleware must be a function!')
      process.exit(0)
    }

    this._handlers.push(middleware)
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
            console.log('RESPONSE SENDED', data)
          },
          end: function(...params) {
            console.log('response end')
            console.log(params)
          }
        }
        this.runHandlers(request, response, (req, res, next) => {
          /**
           * TODO: Connection close management comes here.
           * Maybe adding debug logs or some more events
           */
        })
      })
    })
  }
}

export default Radius