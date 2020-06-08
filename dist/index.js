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
            requestPort: 16379,
            dictionary: [],
            ...customOptions
        };
        helpers_1.eventEmitter.on('error', error => {
            helpers_1.logger.error('Error On Init:', error);
            process.exit(0);
        });
        helpers_1.eventEmitter.on('sockMessage', (socket, buffer, rinfo) => {
            this.handleIncoming(socket, buffer, rinfo);
        });
        const { authorizationPort, accountingPort } = this.options;
        if (authorizationPort === accountingPort) {
            const message = 'Auhotization and Accounting Ports must be different.';
            helpers_1.eventEmitter.emit('error', message);
        }
        helpers_1.Dictionary.load(this.options.dictionary);
        this._clients = new Map();
        this._handlers = {
            'Access-Request': [],
            'Accounting-Request': [],
            'CoA-ACK': [],
            'CoA-NAK': [],
            'Disconnect-ACK': [],
            'Disconnect-NAK': []
        };
    }
    addClient(...clients) {
        clients.forEach(client => {
            if (typeof client.ip !== 'string') {
                helpers_1.eventEmitter.emit('error', `Client IP Must be String, ${typeof client.ip} given in.`);
            }
            this._clients.set(client.ip, client);
        });
    }
    addListener(eventName, callback) {
        helpers_1.eventEmitter.on(eventName, callback);
    }
    use(eventName, middleware = () => { }) {
        if (typeof middleware !== 'function') {
            helpers_1.eventEmitter.emit('error', 'Middleware must be a function!');
            process.exit(0);
        }
        const keys = Object.keys(this._handlers);
        if (typeof eventName === 'function') {
            middleware = eventName;
            eventName = '';
        }
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
    setClient({ address, ...connection }, socket) {
        const client = this._clients.get(address);
        if (client) {
            client.connection = { ...connection };
            client.socket = socket;
        }
        return client || false;
    }
    start() {
        const sockets = ['authorization', 'accounting', 'request'];
        sockets.forEach(type => helpers_1.listen(type, this.options[type + 'Port']));
    }
    async handleIncoming(socket, buffer, rinfo) {
        try {
            const client = this.setClient(rinfo, socket);
            if (!client) {
                helpers_1.logger.debug(rinfo.address, `There is no client in known clients. Connection terminated`);
                return;
            }
            const request = helpers_1.Package.fromBuffer(buffer, client);
            const response = helpers_1.Package.fromRequest(request);
            if (!Object.keys(this._handlers).includes(request.code.name)) {
                throw new Error(`Unknown Request Type for ${request.code.name}`);
            }
            const middlewares = [...this._handlers[request.code.name]];
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
    }
}
exports.default = Radius;
//# sourceMappingURL=index.js.map