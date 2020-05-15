import { listen, Request, Response, Dictionary, eventEmitter } from './helpers'
import Package from './helpers/package'

const debugErr = require('debug')('error')
const debugMsg = require('debug')('debug')

/**
 * @todo
 * [-] More Effective Attribute Class
 * [-] Logger Class
 * [-] VSA for Dictionary
 */

class Radius {
  constructor(customOptions = {}) {
    this.options = {
      authorizationPort : 1812,
      accountingPort : 1813,
      ...customOptions
    }

    /** Default EventEmitter for Errors */
    eventEmitter.on('error', error => {
      debugErr('Error On Init:', error)
      process.exit(0)
    })

    if (this.options.authorizationPort === this.options.accountingPort) {
      eventEmitter.emit('error', 'Auhotization and Accounting Ports must be different.')
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
    if (Array.isArray(clients)) {
      for(let client of clients) {
        this._clients.set(client.ip, client)
      }
    } else if(typeof clients !== 'object') {
      this._clients.set(clients.ip, clients)
    } else {
      eventEmitter.emit('error', 'Client Parameter must be and array or object includes with client model')
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

    return _handler(req, res)
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

  getClient({ address, ...params }) {
    const client = this._clients.get(address)

    if (client) client.connection = { ...params }

    return client || false
  }

  sockets = ['authorization', 'accounting']

  start() {
    this.sockets.forEach(type => {
      const socket = listen(type, this.options[type + 'Port'])

      socket.on('message', (buffer, rinfo) => {
        const client = this.getClient(rinfo)
        if (!client) {
          debugMsg(
            rinfo.address,
            `There is no client in known clients. Connection terminated`
          )
          return
        }

        try {
          const packet = new Package(buffer, client)
          const request = new Request(packet.request)
          const response = new Response(packet, socket)

          this.runHandlers(request, response, (req, res, next) => {})
        } catch(e) {
          debugMsg(
            'Incoming Message:',
            e.message
          )
          return
        }
      })
    })
  }
}

export default Radius