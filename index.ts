import {
  Request,
  Response,
  Dictionary,
  Package,
  logger,
  listen,
  eventEmitter,
} from './helpers'

import { RemoteInfo } from 'dgram'
import { IRadius, ICommon } from './types'

export default class Radius {
  options: IRadius.Options
  _clients: any
  _handlers: any

  constructor(customOptions = {}) {
    this.options = {
      authorizationPort: 1812,
      accountingPort: 1813,
      dictionary: [],
      ...customOptions,
    }

    /** Default EventEmitter for Errors */
    eventEmitter.on('error', error => {
      logger.error('Error On Init:', error)
      process.exit(0)
    })

    const { authorizationPort, accountingPort } = this.options

    if (authorizationPort === accountingPort) {
      const message = 'Auhotization and Accounting Ports must be different.'

      eventEmitter.emit('error', message)
    }

    Dictionary.load(this.options.dictionary)

    this._clients = new Map()
    this._handlers = {
      Access: [],
      Accounting: [],
    }
  }
  /**
   *
   * @param {IRadius.Client} client
   * @model { ip: string, secret: string, name?: string }
   * @example addClient({ip: 192.168.1.1, secret: 'secret'})
   */
  addClient(...clients: IRadius.ClientRegistry[]) {
    clients.forEach(client => {
      this._clients.set(client.ip, client)
    })
  }

  addListener(eventName: string, callback: ICommon.SpreadableFn) {
    eventEmitter.on(eventName, callback)
  }

  use(eventName: string = '', middleware: ICommon.Middleware) {
    if (typeof middleware !== 'function') {
      eventEmitter.emit('error', 'Middleware must be a function!')
      process.exit(0)
    }

    const keys = Object.keys(this._handlers)

    if (eventName === '') {
      keys.forEach(event => {
        this._handlers[event].push(middleware)
      })
    } else if (keys.includes(eventName)) {
      this._handlers[eventName as PropertyKey].push(middleware)
    } else {
      eventEmitter.emit('error', 'Unknown Event Listener. Use only one of theese:', keys)

      process.exit(0)
    }
  }

  getClient({ address, ...connection }: RemoteInfo): IRadius.Client {
    const client = this._clients.get(address)

    if (client) client.connection = { ...connection }

    return client || false
  }

  start() {
    const sockets = ['authorization', 'accounting']

    sockets.forEach(type => {
      const socket = listen(type, this.options[type + 'Port'])

      socket.on('message', async (buffer, rinfo) => {
        const client = this.getClient(rinfo)

        if (!client) {
          logger.debug(
            rinfo.address,
            `There is no client in known clients. Connection terminated`
          )
          return
        }

        try {
          const packet = new Package(buffer, client)
          const request = new Request(packet.request)
          const response = new Response(packet, socket)
          const mwEventName = packet.request.mwEventName

          if (!this._handlers.hasOwnPropery(mwEventName)) {
            throw new Error(`Unknown Request Type for ${mwEventName}`)
          }

          const middlewares = [...this._handlers[mwEventName]]

          const next = async () => {
            if (middlewares.length) await middlewares.shift()(request, response, next)
          }

          await next()
        } catch (e) {
          logger.debug('Incoming Message Error:', e)
          return
        }
      })
    })
  }
}
