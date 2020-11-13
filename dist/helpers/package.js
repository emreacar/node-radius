"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./../types");
const crypto_1 = __importDefault(require("crypto"));
const listen_1 = require("./listen");
const eventEmitter_1 = __importDefault(require("./eventEmitter"));
const attributes_1 = __importDefault(require("./attributes"));
const dictionary_1 = __importDefault(require("./dictionary"));
const code_1 = __importDefault(require("./code"));
const identifierCheck = identifier => {
    if (typeof identifier !== 'number' || Number(identifier) < 0) {
        throw new Error(`Packet Identifier must be unsigned integer. ${typeof identifier} given in.`);
    }
    return identifier;
};
class Package {
    constructor(code = null, identifier = null, authenticator = null, client = {}, attr = {}) {
        code = code_1.default.validate(code);
        identifier = identifierCheck(identifier);
        Object.defineProperties(this, {
            code: {
                get: () => code,
                set: value => (code = code_1.default.validate(value))
            },
            identifier: {
                get: () => identifier,
                set: value => (identifier = identifierCheck(value))
            },
            authenticator: {
                get: () => authenticator.slice(0),
                set: value => (authenticator = value)
            },
            attr: {
                value: attr
            },
            responseAttr: {
                value: []
            },
            client: {
                value: client,
                writable: true
            }
        });
    }
    reject(sendAfter = false) {
        this.code = code_1.default.rejectOf(this.requestCode.id);
        if (sendAfter)
            this.send();
    }
    accept(sendAfter = false) {
        this.code = code_1.default.acceptOf(this.requestCode.id);
        if (sendAfter)
            this.send();
    }
    checkCode() {
        const canResponse = code_1.default.canResponseWith(this.requestCode.id, this.code.id);
        if (!canResponse) {
            throw Error(`You can not response to the ${this.requestCode.name} with the ${this.code.name} code.`);
        }
        return canResponse;
    }
    add(type, value) {
        const attribute = dictionary_1.default.get(type);
        if (!attribute) {
            throw Error(`${type} is unknown attribute...`);
        }
        this.responseAttr.push({
            attribute,
            value
        });
    }
    toBuffer() {
        let offset = 0;
        let BufferData = Buffer.alloc(4096);
        offset = BufferData.writeUInt8(this.code.id, 0);
        offset = BufferData.writeUInt8(this.identifier, offset);
        const length_offset = offset;
        offset = BufferData.writeUInt16BE(0, offset);
        const authenticator_offset = offset;
        this.authenticator.copy(BufferData, offset);
        offset += 16;
        const attrBuffer = attributes_1.default.encodeList(this.responseAttr);
        attrBuffer.copy(BufferData, offset);
        offset += attrBuffer.length;
        const packageLength = offset;
        BufferData.writeUInt16BE(packageLength, length_offset);
        BufferData = BufferData.slice(0, packageLength);
        const hash = crypto_1.default.createHash('md5').update(BufferData).update(this.client.secret);
        const AuthenticationBuffer = Buffer.from(hash.digest('binary'), 'binary');
        AuthenticationBuffer.copy(BufferData, authenticator_offset);
        return BufferData;
    }
    setClient(client) {
        this.client = { ...client };
    }
    setLogUser(logUser) {
        this.logUser = logUser;
    }
    send() {
        if (!this.code) {
            this.reject();
            eventEmitter_1.default.emit('logger', 'debug', 'You should define a response code!');
            eventEmitter_1.default.emit('logger', 'debug', `The request will be responded automatically with the (${this.code}) code.`);
        }
        if (this.requestCode)
            this.checkCode();
        if (Object.keys(this.client).length === 0) {
            throw new Error('You must select a client to be able to send packages.');
        }
        const BodyParams = this.responseAttr.map(attr => {
            return [attributes_1.default.stripName(attr.attribute.attr), attr.value];
        });
        const Body = Object.fromEntries(BodyParams);
        eventEmitter_1.default.emit('logger', 'packet', {
            UserName: this.logUser,
            Code: this.code.name.replace('-', ''),
            NASIdentifier: this.client.name,
            NASIPAddress: this.client.ip,
            Body
        });
        const responsePacket = this.toBuffer();
        const { socket, connection } = this.client;
        if (this.requestCode) {
            socket.send(responsePacket, connection.port, this.client.ip);
        }
        else {
            const requestSocket = listen_1.getSock('request');
            requestSocket.send(responsePacket, this.client.requestPort, this.client.ip);
        }
    }
    static fromBuffer(buffer, client) {
        if (buffer.length < 20) {
            throw new Error(`PACKAGE too short from ${client.address}`);
        }
        if (buffer.length < buffer.readUInt16BE(2)) {
            throw new Error(`Package sizes do not mismatch with length`);
        }
        const length = buffer.readUInt16BE(2);
        const code = buffer.readUInt8(0);
        const identifier = buffer[1];
        const authenticator = buffer.slice(4, 20);
        const attr = attributes_1.default.decodeList(buffer.slice(20, length), client.secret, authenticator);
        return new Package(code, identifier, authenticator, client, attr);
    }
    static fromRequest(request) {
        const { code, identifier, authenticator, client } = request;
        const { UserName } = request.attr;
        const resCode = code_1.default.rejectOf(code.id);
        let resCodeId = resCode.id || 0;
        const packet = new Package(resCodeId, identifier, authenticator, client);
        Object.defineProperties(packet, {
            requestCode: {
                value: code
            },
            logUser: {
                value: UserName
            }
        });
        return packet;
    }
    create(code) {
        if (!code || !code_1.default.get(code)) {
            throw Error(`${code} is unknown`);
        }
        const identifier = Math.floor(Math.random() * 256);
        const authenticator = Buffer.alloc(16);
        authenticator.fill(0x00);
        return new Package(code, identifier, authenticator);
    }
}
exports.default = Package;
//# sourceMappingURL=package.js.map