import { Package, Dictionary, logger, listen, eventEmitter, code } from './helpers'
import { RemoteInfo, Socket } from 'dgram'
import { IRadius, ICommon } from './types'

export default class Radius {
  options: IRadius.Options
  _clients: any
  _handlers: any

  constructor(customOptions = {}) {
    this.options = {
      authorizationPort: 1812,
      accountingPort: 1813,
      requestPort: 16379,
      dictionary: [],
      ...customOptions
    }

    /** Default EventEmitters */
    eventEmitter.on('error', error => {
      logger.error('Error On Init:', error)
      process.exit(0)
    })

    eventEmitter.on('sockMessage', (socket, buffer, rinfo) => {
      this.handleIncoming(socket, buffer, rinfo)
    })

    const { authorizationPort, accountingPort } = this.options

    if (authorizationPort === accountingPort) {
      const message = 'Auhotization and Accounting Ports must be different.'

      eventEmitter.emit('error', message)
    }
    /**
     * @TODO Create metod for load
     */
    Dictionary.load(this.options.dictionary)

    this._clients = new Map()
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
      eventEmitter.emit('error', 'Middleware must be a function!')
      process.exit(0)
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
        'error',
        `Unknown listener for ${eventName}. Use only one of theese: ${keys}`
      )

      process.exit(0)
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

  static create(pCode: string | number) {
    if (!pCode || !code.get(pCode)) {
      throw Error(`${pCode} is unknown`)
    }

    const identifier = Math.floor(Math.random() * 256)
    const authenticator = Buffer.alloc(16)

    authenticator.fill(0x00)

    return new Package(pCode, identifier, authenticator)
  }

  start() {
    const sockets = ['authorization', 'accounting', 'request']

    sockets.forEach(type => listen(type, this.options[type + 'Port']))
  }

  async handleIncoming(socket, buffer, rinfo) {
    try {
      const client = this.setClient(rinfo, socket)

      if (!client) {
        logger.debug(
          rinfo.address,
          `There is no client in known clients. Connection terminated`
        )
        return
      }

      const request = Package.fromBuffer(buffer, client)
      const response = Package.fromRequest(request)

      if (!Object.keys(this._handlers).includes(request.code.name)) {
        throw new Error(`Unknown Request Type for ${request.code.name}`)
      }

      const middlewares = [...this._handlers[request.code.name]]

      const next = async () => {
        if (middlewares.length) await middlewares.shift()(request, response, next)
      }

      await next()
    } catch (e) {
      logger.debug('Incoming Message Error:', e)
      return
    }
  }
}
