import Dictionary from './dictionary'
import Crypt from './Crypt'

const debugMsg = require('debug')('debug')

const ATTR_NAME = 0
const ATTR_TYPE = 1
const ATTR_SPECS = 2

class Attributes {
  constructor() {}

  static decodeList(buffer, secret, Authenticator) {
    const list = {}

    while(buffer.length > 0) {
      const typeAttr = buffer.readUInt8(0)
      const lengthAttr = buffer.readUInt8(1)
      const attr = Attributes.decodeAttribute(
        typeAttr,
        lengthAttr,
        buffer.slice(0, lengthAttr),
        secret,
        Authenticator
      )

      list[attr.name] = attr.value

      buffer = buffer.slice(lengthAttr)
    }
    return list
  }

  static decodeAttribute(type, length, buffer, ...store) {
    if (! (buffer instanceof Uint8Array)) {
      debugMsg('Invalid Type for Attribute Buffer')
      return false
    }

    if (buffer.length !== length) {
      debugMsg(`Length Mismatch in Attribute`)
      return false
    }

    let value = buffer.slice(2, buffer.length)
    const attribute = Dictionary.get(type)

    if (attribute[ATTR_SPECS] && attribute[ATTR_SPECS].includes('encrypt=1')) {
      value = Crypt.decode(value, ...store)
    }

    switch (attribute[ATTR_TYPE]) {
      /** TODO: Add Other Types */
      case 'string':
      case 'text':
        value = value.toString('utf8')
        break
      case 'ipaddr':
        value = [].join.call(value, '.')
        break;
      case 'date':
        value = new Date(value).toISOString()
        break
      case 'time':
      case 'integer':
      value = value.readUInt32BE(0)
      break
    }
    const name = attribute[ATTR_NAME].replace(/-/g, '')
    return { name, value }
  }
}

export default Attributes