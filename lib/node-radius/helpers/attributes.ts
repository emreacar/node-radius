import { debug } from './logger'
import Dictionary from './dictionary'
import Crypt from './crypt'

// Default Vendor Specific ID as RFC2865
const VsaId = 26
const defaultVId = -1

export default class Attributes {
  constructor() {}

  static decodeList(buffer: Buffer, secret: string, Authenticator: Buffer) {
    const list = {}

    while (buffer.length > 0) {
      const typeAttr = buffer.readUInt8(0)
      const lengthAttr = buffer.readUInt8(1)
      const bufferAttr = buffer.slice(0, lengthAttr)

      let vendorId = defaultVId
      let valueOffset = 2 /** includes type and length */

      if (typeAttr === VsaId) {
        vendorId = bufferAttr.readUInt32BE(2) /** Read after length */
        valueOffset = 6 /** includes type, length and vendorId */
      }

      let value = bufferAttr.slice(valueOffset, lengthAttr) as any

      try {
        if (!(bufferAttr instanceof Uint8Array)) {
          throw new Error('Invalid Type for Attribute Buffer')
        }

        const Dict = Attributes.getAttr(typeAttr, vendorId)

        if (Dict.flags && Dict.flags.includes('encrypt=1')) {
          value = Crypt.decode(value, secret, Authenticator)
        }

        switch (Dict.type) {
          case 'string':
          case 'text':
            value = value.toString('utf8')
            break
          case 'ipaddr':
            value = [].join.call(value, '.')
            break
          case 'date':
            value = new Date(value.readUInt32BE(0) * 1000).toISOString()
            break
          case 'time':
          case 'integer':
            value = value.readUInt32BE(0)
            break
        }

        list[Attributes.stripName(Dict.name)] = value
      } catch(e) {
        debug(e)
      }

      /** whatever pass next attr */
      buffer = buffer.slice(lengthAttr)
    }

    return list
  }

  static encodeList(responseAttrs) {
    let attr_offset = 0
    let attrBuffer = Buffer.alloc(4096)

    for (let { attr, value } of responseAttrs) {
      /** @TODO Add Other Types */
      switch (attr.type) {
        case 'string':
        case 'text':
          value = Buffer.from(value, 'utf8')
          break

        case 'ipaddr':
          value = Buffer.from(value.split('.'))
          break

        case 'date':
          value = Math.floor(value.getTime() / 1000)
          break

        case 'time':
        case 'integer':
          value = Buffer.alloc(4).writeUInt32BE(value, 0)
          break
      }

      attr_offset = attrBuffer.writeUInt8(attr.id, attr_offset)
      attr_offset = attrBuffer.writeUInt8(2 + value.length, attr_offset)
      value.copy(attrBuffer, attr_offset)
      attr_offset += value.length
    }

    attrBuffer = attrBuffer.slice(0, attr_offset)

    return attrBuffer
  }

  static getAttr(id:number|string, vendorId:number= defaultVId) {
    return Dictionary.get(id, vendorId)
  }

  static stripName(attrName:string):string {
    return attrName.replace(/-/g, '')
  }

  static decodeVsa(buffer:Buffer) {
    const vendorId = buffer.readUInt32BE(0)

    console.log(vendorId)

    return buffer
  }
}
