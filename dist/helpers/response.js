"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const package_1 = __importDefault(require("./package"));
const dictionary_1 = __importDefault(require("./dictionary"));
const code_1 = __importDefault(require("./code"));
const logger_1 = require("./logger");
class Response {
    constructor(request, socket) {
        let code;
        Object.defineProperties(this, {
            request: {
                value: request
            },
            code: {
                get: () => code,
                set: value => (code = code_1.default.get(value))
            },
            socket: {
                value: socket
            },
            data: {
                value: []
            }
        });
    }
    add(type, value) {
        const attribute = dictionary_1.default.get(type);
        if (!attribute) {
            throw Error(`${type} is unknown attribute...`);
        }
        this.data.push({
            attribute,
            value
        });
    }
    checkCode() {
        const canResponse = code_1.default.canResponseWith(this.request.code.id, this.code.id);
        if (!canResponse) {
            throw Error(`You can not response with ${this.code.name} to ${this.request.code.name} package.`);
        }
        return canResponse;
    }
    reject(sendAfter = false) {
        const reqCode = this.request.code;
        this.code = code_1.default.rejectOf(reqCode.id);
        if (sendAfter)
            this.send();
    }
    accept(sendAfter = false) {
        const reqCode = this.request.code;
        this.code = code_1.default.acceptOf(reqCode.id);
        if (sendAfter)
            this.send();
    }
    send() {
        if (!this.code) {
            this.reject();
            logger_1.debug(`You should define a response code!`);
            logger_1.debug(`Request will automatically responded (${this.code}) code.`);
        }
        this.checkCode();
        const { identifier, authenticator, client } = this.request;
        const responsePacket = package_1.default.toBuffer(this.code, identifier, authenticator, this.data, client);
        this.socket.send(responsePacket, client.connection.port, client.ip);
    }
}
exports.default = Response;
//# sourceMappingURL=response.js.map