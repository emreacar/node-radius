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

    this._handlers = [];
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

  on(eventName, callback) {
    if (typeof eventName === 'string') {
      this.addListener(eventName, callback)
      this._handlers.push(eventName)
    }
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
      throw new Error('Middleware must be a function!')
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