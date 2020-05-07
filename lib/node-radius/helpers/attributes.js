import Dictionary from './dictionary'

const debugMsg = require('debug')('debug')

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
      debugMsg('invalid type for attribute buffer')
      return false
    }

    if (buffer.length < 2) {
      debugMsg('Invalid Attribute Value Length')
      return false
    }

    if (buffer.length !== length) {
      debugMsg(`Length Mismatch in Attribute`)
      return false
    }

    const attrDefine = Dictionary.get(type)

    return attrDefine
  }
}

export default Attributes