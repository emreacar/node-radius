"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigMan = void 0;
require("./../types");
const config = {
    authorizationPort: 1812,
    accountingPort: 1813,
    requestPort: 16379,
    dictionary: [],
    logLevels: {
        error: 1,
        info: 1,
        debug: 1,
        request: 1,
        response: 1
    },
    logLevel: 'debug',
    logFilename: 'logs/combined.log'
};
exports.ConfigMan = {
    init: (customOptions = {}) => {
        return {
            ...config,
            ...customOptions
        };
    },
    set: (key, value) => {
        config[key] = value;
    },
    get: key => {
        return config[key] || false;
    }
};
exports.default = exports.ConfigMan;
//# sourceMappingURL=config.js.map