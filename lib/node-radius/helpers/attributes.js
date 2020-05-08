import Dictionary from './dictionary'

const debugMsg = require('debug')('debug')

const ATTR_TYPE = 1
const ATTR_SPECS = 2

class Attributes {
  constructor() {
  }

  static decodeList(buffer) {
    const list = []

    while(buffer.length > 0) {
      const typeAttr = buffer.readUInt8(0)
      const lengthAttr = buffer.readUInt8(1)
      const valueAttr = Attributes.decodeAttribute(
        typeAttr,
        lengthAttr,
        buffer.slice(0, lengthAttr)
      )

      list.push([typeAttr, valueAttr])

      buffer = buffer.slice(lengthAttr)
    }
    return list
  }

  static decodeAttribute(type, length, buffer) {
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
    switch (attribute[ATTR_TYPE]) {
      /** TODO: Add Other Types */
      case 'string':
      case 'text':
        value = value.toString('utf8')
        break
      case 'integer':
        value = value.readUInt32BE(0)
        break
      case "date":
        value = new Date(value).toISOString()
        break
      case 'ipaddr':
        value = [].join.call(value, '.')
        break;
    }

    if (attribute[ATTR_SPECS] && attribute[ATTR_SPECS].includes('encrypt=1')) {
      /** TODO: d/encrypt class  */
    }

    return value
  }
}

export default Attributes