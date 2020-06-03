"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
require("dgram");
require("./types");
class Radius {
    constructor(customOptions = {}) {
        this.options = {
            authorizationPort: 1812,
            accountingPort: 1813,
            dictionary: [],
            ...customOptions
        };
        helpers_1.eventEmitter.on('error', error => {
            helpers_1.logger.error('Error On Init:', error);
            process.exit(0);
        });
        const { authorizationPort, accountingPort } = this.options;
        if (authorizationPort === accountingPort) {
            const message = 'Auhotization and Accounting Ports must be different.';
            helpers_1.eventEmitter.emit('error', message);
        }
        helpers_1.Dictionary.load(this.options.dictionary);
        this._clients = new Map();
        this._handlers = {
            Access: [],
            Accounting: []
        };
    }
    addClient(...clients) {
        clients.forEach(client => {
            this._clients.set(client.ip, client);
        });
    }
    addListener(eventName, callback) {
        helpers_1.eventEmitter.on(eventName, callback);
    }
    use(eventName = '', middleware) {
        if (typeof middleware !== 'function') {
            helpers_1.eventEmitter.emit('error', 'Middleware must be a function!');
            process.exit(0);
        }
        const keys = Object.keys(this._handlers);
        if (eventName === '') {
            keys.forEach(event => {
                this._handlers[event].push(middleware);
            });
        }
        else if (keys.includes(eventName)) {
            this._handlers[eventName].push(middleware);
        }
        else {
            helpers_1.eventEmitter.emit('error', `Unknown listener for ${eventName}. Use only one of theese: ${keys}`);
            process.exit(0);
        }
    }
    getClient({ address, ...connection }) {
        const client = this._clients.get(address);
        if (client)
            client.connection = { ...connection };
        return client || false;
    }
    start() {
        const sockets = ['authorization', 'accounting'];
        sockets.forEach(type => {
            const socket = helpers_1.listen(type, this.options[type + 'Port']);
            socket.on('message', async (buffer, rinfo) => {
                const client = this.getClient(rinfo);
                if (!client) {
                    helpers_1.logger.debug(rinfo.address, `There is no client in known clients. Connection terminated`);
                    return;
                }
                try {
                    const request = helpers_1.Package.fromBuffer(buffer, client);
                    const response = new helpers_1.Response(request, socket);
                    const mwEventName = request.code.eventName;
                    if (!Object.keys(this._handlers).includes(mwEventName)) {
                        throw new Error(`Unknown Request Type for ${mwEventName}`);
                    }
                    const middlewares = [...this._handlers[mwEventName]];
                    const next = async () => {
                        if (middlewares.length)
                            await middlewares.shift()(request, response, next);
                    };
                    await next();
                }
                catch (e) {
                    helpers_1.logger.debug('Incoming Message Error:', e);
                    return;
                }
            });
        });
    }
}
exports.default = Radius;
//# sourceMappingURL=index.js.map