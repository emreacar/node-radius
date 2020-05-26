"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const dictionary_1 = __importDefault(require("./dictionary"));
const crypt_1 = __importDefault(require("./crypt"));
const VsaId = 26;
const defaultVId = -1;
class Attributes {
    constructor() { }
    static decodeList(buffer, secret, Authenticator) {
        const list = {};
        while (buffer.length > 0) {
            const typeAttr = buffer.readUInt8(0);
            const lengthAttr = buffer.readUInt8(1);
            const bufferAttr = buffer.slice(0, lengthAttr);
            let vendorId = defaultVId;
            let valueOffset = 2;
            if (typeAttr === VsaId) {
                vendorId = bufferAttr.readUInt32BE(2);
                valueOffset = 6;
            }
            let value = bufferAttr.slice(valueOffset, lengthAttr);
            try {
                if (!(bufferAttr instanceof Uint8Array)) {
                    throw new Error('Invalid Type for Attribute Buffer');
                }
                const Dict = Attributes.getAttr(typeAttr, vendorId);
                if (Dict.flags && Dict.flags.includes('encrypt=1')) {
                    value = crypt_1.default.decode(value, secret, Authenticator);
                }
                switch (Dict.type) {
                    case 'string':
                    case 'text':
                        value = value.toString('utf8');
                        break;
                    case 'ipaddr':
                        value = [].join.call(value, '.');
                        break;
                    case 'date':
                        value = new Date(value.readUInt32BE(0) * 1000).toISOString();
                        break;
                    case 'time':
                    case 'integer':
                        value = value.readUInt32BE(0);
                        break;
                }
                list[Attributes.stripName(Dict.name)] = value;
            }
            catch (e) {
                logger_1.debug(e);
            }
            buffer = buffer.slice(lengthAttr);
        }
        return list;
    }
    static encodeList(responseAttrs) {
        let attr_offset = 0;
        let attrBuffer = Buffer.alloc(4096);
        for (let { attr, value } of responseAttrs) {
            switch (attr.type) {
                case 'string':
                case 'text':
                    value = Buffer.from(value, 'utf8');
                    break;
                case 'ipaddr':
                    value = Buffer.from(value.split('.'));
                    break;
                case 'date':
                    value = Math.floor(value.getTime() / 1000);
                    break;
                case 'time':
                case 'integer':
                    value = Buffer.alloc(4).writeUInt32BE(value, 0);
                    break;
            }
            attr_offset = attrBuffer.writeUInt8(attr.id, attr_offset);
            attr_offset = attrBuffer.writeUInt8(2 + value.length, attr_offset);
            value.copy(attrBuffer, attr_offset);
            attr_offset += value.length;
        }
        attrBuffer = attrBuffer.slice(0, attr_offset);
        return attrBuffer;
    }
    static getAttr(id, vendorId = defaultVId) {
        return dictionary_1.default.get(id, vendorId);
    }
    static stripName(attrName) {
        return attrName.replace(/-/g, '');
    }
}
exports.default = Attributes;
//# sourceMappingURL=attributes.js.map