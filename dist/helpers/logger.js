"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const graylog2_1 = __importDefault(require("graylog2"));
const os_1 = require("os");
const gLogger = new graylog2_1.default.graylog({
    servers: [
        {
            host: 'nglog.turancoskun.com',
            port: 49514
        }
    ],
    hostname: os_1.hostname() || 'node-radius',
    facility: 'Radius'
});
gLogger.on('error', function (error) {
    console.error(`(PID: ${process.pid}) Error while trying to write to graylog2:`, error);
});
exports.Logger = params => {
    gLogger.log(params);
};
exports.default = exports.Logger;
//# sourceMappingURL=logger.js.map