"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.debug = exports.info = exports.error = void 0;
const debug_1 = __importDefault(require("debug"));
debug_1.default.enable('info, debug, error');
exports.error = debug_1.default('error');
exports.info = debug_1.default('info');
exports.debug = debug_1.default('debug');
exports.default = {
    error: exports.error,
    info: exports.info,
    debug: exports.debug,
};
//# sourceMappingURL=logger.js.map