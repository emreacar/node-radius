import {
  Request,
  Response,
  Dictionary,
  Package,
  logger,
  listen,
  eventEmitter,
} from './helpers';
import { RemoteInfo } from 'dgram';

/**
 * @todo
 * [-] More Effective Attribute Class
 * [-] VSA for Dictionary
 */

export default class Radius {
  options: Radius.Options;
  _clients: any;
  _handlers: any;
  _customEvents: string[];

  constructor(customOptions = {}) {
    this.options = {
      authorizationPort: 1812,
      accountingPort: 1813,
      ...customOptions,
    };

    /** Default EventEmitter for Errors */
    eventEmitter.on('error', error => {
      logger.error('Error On Init:', error);
      process.exit(0);
    });

    const { authorizationPort, accountingPort } = this.options;

    if (authorizationPort === accountingPort) {
      const message = 'Auhotization and Accounting Ports must be different.';

      eventEmitter.emit('error', message);
    }

    /** Todo: Add Dictionary To middleware after */
    Dictionary.load();

    this._clients = new Map();
    this._handlers = [];

    this._customEvents = ['error'];
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
      for (let client of clients) {
        this._clients.set(client.ip, client);
      }
    } else if (typeof clients !== 'object') {
      this._clients.set(clients.ip, clients);
    } else {
      eventEmitter.emit(
        'error',
        'Client Parameter must be an array or an object including client model'
      );
    }
  }

  addListener(eventName: string, callback: SpreadableFn) {
    eventEmitter.on(eventName, callback);
  }

  /**
   *
   * @param {Function} middleware
   */
  use(middleware: Middleware) {
    if (typeof middleware !== 'function') {
      eventEmitter.emit('error', 'Middleware must be a function!');
      process.exit(0);
    }

    this._handlers.push(middleware);
  }

  getClient({ address, ...params }: RemoteInfo): Radius.Client {
    const client = this._clients.get(address);

    if (client) client.connection = { ...params };

    return client || false;
  }

  start() {
    const sockets = ['authorization', 'accounting'];

    sockets.forEach(type => {
      const socket = listen(type, this.options[type + 'Port']);

      socket.on('message', async (buffer, rinfo) => {
        const client = this.getClient(rinfo);

        if (!client) {
          logger.debug(
            rinfo.address,
            `There is no client in known clients. Connection terminated`
          );
          return;
        }

        try {
          const packet = new Package(buffer, client);
          const request = new Request(packet.request);
          const response = new Response(packet);

          const middlewares = [...this._handlers];

          const next = async () => {
            if (middlewares.length) await middlewares.shift()(request, response, next);
          };

          await next();

          response.on('send', (...params) => {
            socket.send.apply(this, params as any);
          });
        } catch (e) {
          // logger.debug('Incoming Message Error:', e.message)
          return;
        }
      });
    });
  }
}
