"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const winston_1 = require("winston");
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
    level: 'debug',
    format: combine(timestamp(), json()),
    defaultMeta: { service: 'radius' },
    transports: [new winston_1.transports.File({ filename: 'logs/combined.log' })]
});
exports.Logger = params => winLogger.log(params);
exports.default = exports.Logger;
//# sourceMappingURL=logger.js.map