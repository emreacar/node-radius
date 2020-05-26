"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const codeRelations = {
    1: {
        accept: { code: 2, name: 'Access-Accept' },
        reject: { code: 3, name: 'Access-Reject' },
        default: { code: 3, name: 'Access-Reject' },
        allows: [2, 3],
    },
    4: {
        default: { code: 5, name: 'Accounting-Response' },
        allows: [5],
    },
};
class Response {
    constructor(packet, socket) {
        let code;
        Object.defineProperties(this, {
            packet: {
                value: packet,
            },
            request: {
                value: packet.request,
            },
            code: {
                set: value => (code = this.checkCode(value)),
                get: () => code,
            },
            socket: {
                value: socket,
            },
        });
    }
    checkCode(code) {
        const codeId = this.packet.getCodeId(code);
        const reqCodeId = this.request.CodeId;
        if (!codeId)
            throw Error(`${code}: Code is invalid`);
        if (!codeRelations[reqCodeId] || !codeRelations[reqCodeId].allows.includes(codeId)) {
            throw Error(`You can not response with ${code} to ${this.packet.getCodeName(reqCodeId)} package.`);
        }
        return code;
    }
    reject(sendAfter = false) {
        const reqCodeId = this.request.CodeId;
        const Code = codeRelations[reqCodeId].reject || codeRelations[reqCodeId].default;
        this.code = Code.name;
        if (sendAfter)
            this.send();
    }
    accept(sendAfter = false) {
        const reqCodeId = this.request.CodeId;
        const Code = codeRelations[reqCodeId].accept || codeRelations[reqCodeId].default;
        this.code = Code.name;
        if (sendAfter)
            this.send();
    }
    add(type, value) {
        this.packet.addAttribute(type, value);
    }
    send() {
        if (!this.code) {
            this.reject();
            logger_1.debug(`You should define a response code!`);
            logger_1.debug(`Request will automatically responded (${this.code}) code.`);
        }
        const responsePacket = this.packet.encode(this.code);
        this.socket.send(responsePacket, this.request.Client.connection.port, this.request.Client.ip);
    }
}
exports.default = Response;
//# sourceMappingURL=response.js.map