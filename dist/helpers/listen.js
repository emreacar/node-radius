"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSock = exports.listen = void 0;
const dgram_1 = require("dgram");
const eventEmitter_1 = __importDefault(require("./eventEmitter"));
const logger_1 = require("./logger");
require("../types");
const activeListeners = {};
exports.listen = (type, targetPort) => {
    const socket = dgram_1.createSocket('udp4');
    socket.on('error', err => {
        socket.close();
        eventEmitter_1.default.emit('error', `Socket Error: on ${type} socket \n${err.message}`);
    });
    socket.on('listening', () => {
        const { address, port } = socket.address();
        logger_1.info(`${type} socket started on ${address}:${port}`);
    });
    socket.on('message', (buffer, rinfo) => {
        eventEmitter_1.default.emit('sockMessage', socket, buffer, rinfo);
    });
    socket.bind(targetPort);
    activeListeners[type] = socket;
    return socket;
};
exports.getSock = (type) => activeListeners[type];
exports.default = { listen: exports.listen, getSock: exports.getSock };
//# sourceMappingURL=listen.js.map