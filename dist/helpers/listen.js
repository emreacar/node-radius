"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dgram_1 = require("dgram");
const eventEmitter_1 = __importDefault(require("./eventEmitter"));
const logger_1 = require("./logger");
const listen = (type, targetPort) => {
    const socket = dgram_1.createSocket('udp4');
    socket.on('error', err => {
        socket.close();
        eventEmitter_1.default.emit('error', `Socket Error: on ${type} socket \n${err.message}`);
    });
    socket.on('listening', () => {
        const { address, port } = socket.address();
        logger_1.info(`${type} socket started on ${address}:${port}`);
    });
    socket.bind(targetPort);
    return socket;
};
exports.default = listen;
//# sourceMappingURL=listen.js.map