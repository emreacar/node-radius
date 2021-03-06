import { RemoteInfo, Socket } from 'dgram'
import {
  ConfigMan,
  Package,
  Dictionary,
  listen,
  eventEmitter,
  code,
  Logger
} from './helpers'
import { IRadius, ICommon } from './types'

export const RLogger = (level, message) => {
  if (
    Object.keys(ConfigMan.get('logLevels')).includes(level) &&
    ConfigMan.get('logLevels')[level] === 1
  ) {
    Logger({ level, message })
  }

  if (level === 'error') {
    process.exit()
  }
}

export default class Radius {
  options: IRadius.Options
  _clients: any
  _handlers: any

  constructor(customOptions = {}) {
    this.options = ConfigMan.init(customOptions)
    /** Default EventEmitters */
    eventEmitter.on('logger', RLogger)

    eventEmitter.on('sockMessage', (socket, buffer, rinfo) => {
      this.handleIncoming(socket, buffer, rinfo)
    })

    const { authorizationPort, accountingPort } = this.options

    if (authorizationPort === accountingPort) {
      eventEmitter.emit(
        'logger',
        'error',
        'Auhotization and Accounting Ports must be different.'
      )
    }
    /**
     * @TODO Create metod for load
     */
    Dictionary.load(this.options.dictionary)

    this._clients = new Map()
    /**
     * @TODO Add Access-Challenge Request
     */
    this._handlers = {
      'Access-Request': [],
      'Accounting-Request': [],
      'CoA-ACK': [],
      'CoA-NAK': [],
      'Disconnect-ACK': [],
      'Disconnect-NAK': []
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
      if (typeof client.ip !== 'string') {
        eventEmitter.emit(
          'logger',
          'error',
          `Client IP Must be String, ${typeof client.ip} given in.`
        )
      }

      this._clients.set(client.ip, client)
    })
  }

  addListener(eventName: string, callback: ICommon.SpreadableFn) {
    eventEmitter.on(eventName, callback)
  }

  use(eventName: string | ICommon.Middleware, middleware: ICommon.Middleware = () => {}) {
    if (typeof middleware !== 'function') {
      eventEmitter.emit('logger', 'error', 'Middleware must be a function!')
    }

    const keys = Object.keys(this._handlers)

    if (typeof eventName === 'function') {
      /**
       * @description Allow server.use(function() => {})... sort hand
       */
      middleware = eventName
      eventName = ''
    }

    if (eventName === '') {
      keys.forEach(event => {
        this._handlers[event].push(middleware)
      })
    } else if (keys.includes(eventName)) {
      this._handlers[eventName as PropertyKey].push(middleware)
    } else {
      eventEmitter.emit(
        'logger',
        'error',
        `Unknown listener for ${eventName}. Use only one of theese: ${keys}`
      )
    }
  }

  setClient({ address, ...connection }: RemoteInfo, socket: Socket): IRadius.Client {
    const client = this._clients.get(address)

    if (client) {
      client.connection = { ...connection }
      client.socket = socket
    }

    return client || false
  }

  static create(pCode: string | number, pFor: string) {
    if (!pCode || !code.get(pCode)) {
      throw new Error(`${pCode} is unknown`)
    }

    const identifier = Math.floor(Math.random() * 256)
    const authenticator = Buffer.alloc(16)

    authenticator.fill(0x00)
    const p = new Package(pCode, identifier, authenticator)

    if (pFor !== '' && typeof pFor === 'string') p.setLogUser(pFor)

    return p
  }

  start() {
    const sockets = ['authorization', 'accounting', 'request']

    sockets.forEach(type => listen(type, this.options[type + 'Port']))
  }

  async handleIncoming(socket, buffer, rinfo) {
    try {
      const client = this.setClient(rinfo, socket)

      if (!client) {
        throw new Error(
          `(PID: ${process.pid}) ${rinfo.address}: There is no client in known clients. Connection terminated`
        )
      }

      const request = Package.fromBuffer(buffer, client)
      const {
        UserName,
        NASIdentifier,
        UserPassword,
        NASIPAddress,
        ...Body
      } = request.attr

      eventEmitter.emit('logger', 'packet', {
        PID: process.pid,
        UserName,
        Code: request.code.name.replace('-', ''),
        NASIdentifier,
        NASIPAddress,
        Body
      })

      if (!Object.keys(this._handlers).includes(request.code.name)) {
        throw new Error(
          `(PID: ${process.pid}) Unknown Request Type for ${request.code.name}, from ${rinfo.address}`
        )
      }

      const response = Package.fromRequest(request)
      const middlewares = [...this._handlers[request.code.name]]

      const next = async () => {
        if (middlewares.length) await middlewares.shift()(request, response, next)
      }

      await next()
    } catch (e) {
      eventEmitter.emit('logger', 'info', e.message)
      return
    }
  }
}
