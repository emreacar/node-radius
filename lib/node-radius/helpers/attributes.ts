import { debug } from './logger';
import Dictionary from './dictionary';
import Crypt from './crypt';

const ATTR_NAME = 0;
const ATTR_TYPE = 1;
const ATTR_SPECS = 2;
const ATTR_ID = 3;

export default class Attributes {
  constructor() {}

  static decodeList(buffer: Buffer, secret: string, Authenticator: Buffer) {
    const list = {};

    while (buffer.length > 0) {
      const typeAttr = buffer.readUInt8(0);
      const lengthAttr = buffer.readUInt8(1);
      const attr = Attributes.decodeAttribute(
        typeAttr,
        lengthAttr,
        buffer.slice(0, lengthAttr),
        secret,
        Authenticator
      );

      if (attr) {
        list[attr.name] = attr.value;

        buffer = buffer.slice(lengthAttr);
      }
    }

    return list;
  }

  static encodeList(responseAttrs) {
    let attr_offset = 0;
    let attrBuffer = Buffer.alloc(4096);

    for (let { attribute, value } of responseAttrs) {
      /** @TODO Add Other Types */
      switch (attribute[ATTR_TYPE]) {
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

      attr_offset = attrBuffer.writeUInt8(attribute[ATTR_ID], attr_offset);
      attr_offset = attrBuffer.writeUInt8(2 + value.length, attr_offset);
      value.copy(attrBuffer, attr_offset);
      attr_offset += value.length;
    }

    attrBuffer = attrBuffer.slice(0, attr_offset);

    return attrBuffer;
  }

  static getType(type) {
    return Dictionary.get(type);
  }

  static decodeAttribute(
    type: number,
    length: number,
    buffer: Buffer,
    secret: String,
    Authenticator: Buffer
  ) {
    if (!(buffer instanceof Uint8Array)) {
      return debug('Invalid Type for Attribute Buffer');
    }

    if (buffer.length !== length) {
      return debug(`Length Mismatch in Attribute`);
    }

    let value = buffer.slice(2, buffer.length) as any;
    const attribute = Attributes.getType(type);
    // console.log(attribute, value)
    if (attribute[ATTR_SPECS] && attribute[ATTR_SPECS].includes('encrypt=1')) {
      value = Crypt.decode(value, secret, Authenticator);
    }

    switch (attribute[ATTR_TYPE]) {
      /** @TODO Add Other Types */
      case 'string':
      case 'text':
        value = value.toString('utf8');
        break;

      case 'ipaddr':
        value = [].join.call(value, '.');
        break;

      case 'date':
        value = new Date(value).toISOString();
        break;

      case 'time':
      case 'integer':
        value = value.readUInt32BE(0);
        break;
    }

    const name = attribute[ATTR_NAME].replace(/-/g, '');

    return { name, value };
  }
}
