"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const winston_1 = require("winston");
const config_1 = __importDefault(require("./config"));
const { combine, timestamp, json } = winston_1.format;
const levels = {
    error: 0,
    info: 1,
    request: 2,
    response: 3,
    debug: 4
};
const winLogger = winston_1.createLogger({
    levels,
    level: config_1.default.get('logLevel'),
    format: combine(timestamp(), json()),
    defaultMeta: { service: 'radius' },
    transports: [new winston_1.transports.File({ filename: config_1.default.get('logFilename') })]
});
exports.Logger = params => winLogger.log(params);
exports.default = exports.Logger;
//# sourceMappingURL=logger.js.map