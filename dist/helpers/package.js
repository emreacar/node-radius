"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./../types");
const crypto_1 = __importDefault(require("crypto"));
const attributes_1 = __importDefault(require("./attributes"));
require("./dictionary");
const code_1 = __importDefault(require("./code"));
class Package {
    constructor(code, identifier, authenticator, attr, client) {
        code = code_1.default.get(code);
        Object.defineProperties(this, {
            code: {
                get: () => code,
                set: value => (code = code_1.default.get(value))
            },
            identifier: {
                value: identifier
            },
            authenticator: {
                get: () => authenticator.slice(0),
                set: value => (authenticator = value)
            },
            data: {
                value: attr
            },
            client: {
                value: client
            },
            responseAttrs: {
                value: []
            }
        });
    }
    static fromBuffer(buffer, client) {
        if (buffer.length < 20) {
            throw new Error(`PACKAGE too short from ${client.address}`);
        }
        if (buffer.length < buffer.readUInt16BE(2)) {
            throw new Error(`Package sizes do not mismatch`);
        }
        const length = buffer.readUInt16BE(2);
        const code = buffer.readUInt8(0);
        const identifier = buffer[1];
        const authenticator = buffer.slice(4, 20);
        const attr = attributes_1.default.decodeList(buffer.slice(20, length), client.secret, authenticator);
        return new Package(code, identifier, authenticator, attr, client);
    }
    static toBuffer(code, identifier, authenticator, attr, client) {
        let offset = 0;
        let BufferData = Buffer.alloc(4096);
        offset = BufferData.writeUInt8(code.id, 0);
        offset = BufferData.writeUInt8(identifier, offset);
        const length_offset = offset;
        offset = BufferData.writeUInt16BE(0, offset);
        const authenticator_offset = offset;
        authenticator.copy(BufferData, offset);
        offset += 16;
        const attrBuffer = attributes_1.default.encodeList(attr);
        attrBuffer.copy(BufferData, offset);
        offset += attrBuffer.length;
        const packageLength = offset;
        BufferData.writeUInt16BE(packageLength, length_offset);
        BufferData = BufferData.slice(0, packageLength);
        const hash = crypto_1.default
            .createHash('md5')
            .update(BufferData)
            .update(client.secret)
            .digest('binary');
        const AuthenticationBuffer = Buffer.from(hash, 'binary');
        AuthenticationBuffer.copy(BufferData, authenticator_offset);
        return BufferData;
    }
}
exports.default = Package;
//# sourceMappingURL=package.js.map