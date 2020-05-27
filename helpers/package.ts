import crypto from 'crypto'
import Attributes from './attributes'

const codeFromId = new Map([
  [1, 'Access-Request'],
  [2, 'Access-Accept'],
  [3, 'Access-Reject'],
  [4, 'Accounting-Request'],
  [5, 'Accounting-Response'],
  [11, 'Access-Challenge'],
  [12, 'Status-Server'],
  [13, 'Status-Client'],
])

const codeFromName = new Map(
  [...codeFromId.entries()].map(([key, value]) => [value, key])
)

export default class Package {
  responseAttrs: any
  request: any

  /**
   *
   * @param {Buffer} buffer
   * @param {Object} client
   */
  constructor(buffer, client) {
    Package.validate(buffer, client)
    this.decode(buffer, client)
  }

  /**
   * @param {Buffer} buffer
   * @param {Object} client
   * @returns {Boolean|Error} true or throws an Error()
   */
  static validate(buffer, client) {
    if (buffer.length < 20) {
      throw new Error(`PACKAGE too short from ${client.address}`)
    }

    if (buffer.length < buffer.readUInt16BE(2)) {
      throw new Error(`Package sizes do not mismatch`)
    }
    return true
  }
  /**
   *
   * @param {String} code
   * @return {Number}
   */
  getCodeId(code) {
    return codeFromName.get(code)
  }

  /**
   *
   * @param {Number} codeId
   * @return {String}
   */
  getCodeName(codeId) {
    return codeFromId.get(codeId)
  }
  /**
   * @param {Buffer} buffer
   * @param {Object} client
   * @returns {Object} Creates Package Request, Client and Resposne Objects
   */
  decode(buffer, client) {
    const Length = buffer.readUInt16BE(2)
    const CodeId = buffer.readUInt8(0)
    const Code = codeFromId.get(CodeId)
    const mwEventName = Code.replace('-Request', '')
    const Identifier = buffer[1]
    const Authenticator = buffer.slice(4, 20)
    const Attr = Attributes.decodeList(
      buffer.slice(20, Length),
      client.secret,
      Authenticator
    )

    Object.defineProperties(this, {
      client: {
        value: client,
      },
      request: {
        value: {
          Client: client,
          Length,
          Identifier,
          Authenticator,
          Code,
          mwEventName,
          CodeId,
          Attr,
        },
      },
      responseAttrs: {
        value: [],
      },
    })
  }

  /**
   *
   * @param {String} type
   * @param {*} value
   * @TODO add value validation for type
   */
  addAttribute(type: string, value: any) {
    const attribute = Attributes.getAttr(type)
    if (!attribute) throw Error(`${type} is unknown attribute.`)

    this.responseAttrs.push({
      attribute,
      value,
    })
  }

  encode(code) {
    const Code = codeFromName.get(code)
    const { Client, Identifier, Authenticator } = this.request
    let responseBuffer = Buffer.alloc(4096)
    if (Code === undefined) {
      throw new Error('Package Code is Invalid.')
    }

    let offset = 0
    offset = responseBuffer.writeUInt8(Code, 0)
    offset = responseBuffer.writeUInt8(Identifier, offset)

    const length_offset = offset
    offset = responseBuffer.writeUInt16BE(0, offset)

    const authenticator_offset = offset
    Authenticator.copy(responseBuffer, offset)
    offset += 16 /** Because Authenticator Length is 16 */

    const attrBuffer = Attributes.encodeList(this.responseAttrs)
    attrBuffer.copy(responseBuffer, offset)

    offset += attrBuffer.length

    const packageLength = offset
    responseBuffer.writeUInt16BE(packageLength, length_offset)
    responseBuffer = responseBuffer.slice(0, packageLength)

    /** restore Authentication */
    const hash = crypto
      .createHash('md5')
      .update(responseBuffer)
      .update(Client.secret)
      .digest('binary' as any)

    const AuthenticationBuffer = Buffer.from(hash, 'binary')
    AuthenticationBuffer.copy(responseBuffer, authenticator_offset)

    return responseBuffer
  }
}
