"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RLogger = void 0;
require("dgram");
const helpers_1 = require("./helpers");
require("./types");
exports.RLogger = (level, message) => {
    if (Object.keys(helpers_1.ConfigMan.get('logLevels')).includes(level) &&
        helpers_1.ConfigMan.get('logLevels')[level] === 1) {
        helpers_1.Logger({ level, message });
    }
    if (level === 'error') {
        process.exit();
    }
};
class Radius {
    constructor(customOptions = {}) {
        this.options = helpers_1.ConfigMan.init(customOptions);
        helpers_1.eventEmitter.on('logger', exports.RLogger);
        helpers_1.eventEmitter.on('sockMessage', (socket, buffer, rinfo) => {
            this.handleIncoming(socket, buffer, rinfo);
        });
        const { authorizationPort, accountingPort } = this.options;
        if (authorizationPort === accountingPort) {
            helpers_1.eventEmitter.emit('logger', 'error', 'Auhotization and Accounting Ports must be different.');
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
                helpers_1.eventEmitter.emit('logger', 'error', `Client IP Must be String, ${typeof client.ip} given in.`);
            }
            this._clients.set(client.ip, client);
        });
    }
    addListener(eventName, callback) {
        helpers_1.eventEmitter.on(eventName, callback);
    }
    use(eventName, middleware = () => { }) {
        if (typeof middleware !== 'function') {
            helpers_1.eventEmitter.emit('logger', 'error', 'Middleware must be a function!');
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
            helpers_1.eventEmitter.emit('logger', 'error', `Unknown listener for ${eventName}. Use only one of theese: ${keys}`);
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
    static create(pCode, pFor) {
        if (!pCode || !helpers_1.code.get(pCode)) {
            throw new Error(`${pCode} is unknown`);
        }
        const identifier = Math.floor(Math.random() * 256);
        const authenticator = Buffer.alloc(16);
        authenticator.fill(0x00);
        const p = new helpers_1.Package(pCode, identifier, authenticator);
        if (pFor !== '' && typeof pFor === 'string')
            p.setLogUser(pFor);
        return p;
    }
    start() {
        const sockets = ['authorization', 'accounting', 'request'];
        sockets.forEach(type => helpers_1.listen(type, this.options[type + 'Port']));
    }
    async handleIncoming(socket, buffer, rinfo) {
        try {
            const client = this.setClient(rinfo, socket);
            if (!client) {
                throw new Error(`(PID: ${process.pid}) ${rinfo.address}: There is no client in known clients. Connection terminated`);
            }
            const request = helpers_1.Package.fromBuffer(buffer, client);
            const { UserName, NASIdentifier, UserPassword, NASIPAddress, ...Body } = request.attr;
            helpers_1.eventEmitter.emit('logger', 'packet', {
                PID: process.pid,
                UserName,
                Code: request.code.name.replace('-', ''),
                NASIdentifier,
                NASIPAddress,
                Body
            });
            if (!Object.keys(this._handlers).includes(request.code.name)) {
                throw new Error(`(PID: ${process.pid}) Unknown Request Type for ${request.code.name}, from ${rinfo.address}`);
            }
            const response = helpers_1.Package.fromRequest(request);
            const middlewares = [...this._handlers[request.code.name]];
            const next = async () => {
                if (middlewares.length)
                    await middlewares.shift()(request, response, next);
            };
            await next();
        }
        catch (e) {
            helpers_1.eventEmitter.emit('logger', 'info', e.message);
            return;
        }
    }
}
exports.default = Radius;
//# sourceMappingURL=index.js.map