import Attributes from './attributes'

const codeFromId = new Map([
  [1, 'Access-Request' ],
  [2, 'Access-Accept'],
  [3, 'Access-Reject'],
  [4, 'Accounting-Request' ],
  [5, 'Accounting-Response'],
  [11, 'Access-Challenge' ],
  [12, 'Status-Server' ],
  [13, 'Status-Client']
])

const codeFromName = new Map([...codeFromId.entries()]
  .map( ([key, value]) => ([value, key]) ))

class Package {
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
  static validate (buffer, client) {
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
  getCodeId (code) {
    return codeFromName.get(code)
  }

  /**
   *
   * @param {Number} codeId
   * @return {String}
   */
  getCodeName (codeId) {
    return codeFromId.get(codeId)
  }
  /**
   * @param {Buffer} buffer
   * @param {Object} client
   * @returns {Object} Creates Package Request, Client and Resposne Objects
   */
  decode (buffer, client) {
    const Length = buffer.readUInt16BE(2)
    const CodeId = buffer.readUInt8(0)
    const Code = codeFromId.get(CodeId)
    const Identifier = buffer[1]
    const Authenticator = buffer.slice(4, 20)
    const Attr = Attributes.decodeList(
      buffer.slice(20, Length),
      client.secret,
      Authenticator
    )

    Object.defineProperties(this, {
      client: {
        value: client
      },
      request: {
        value: {
          Client: client,
          Length,
          Identifier,
          Authenticator,
          Code,
          CodeId,
          Attr
        }
      },
      responseAttrs: {
        value: []
      }
    })
  }

  /**
   *
   * @param {String} type
   * @param {*} value
   * @TODO add value validation for type
   */
  addAttribute(type, value) {
    const attribute = Attributes.getType(type)
    if(!attribute) throw Error(`${type} is unknown attribute.`)

    this.responseAttrs.push({
      attribute,
      value
    })
  }

  encode(code) {
    const Code = codeFromName.get(code)

    if (Code === undefined) {
      throw new Error('Package Code is Invalid.')
    }

    const {Client, Identifier, Authenticator } = this.request

    let response = Buffer.alloc(4096)
    let offset = 0

    offset = response.writeUInt8(Code, offset)
    offset = response.writeUInt8(Identifier, offset)

    /**
     * After known all length of packet we return back here
     */
    const length_offset = offset
    offset = response.writeUInt16BE(0, offset)

    const auth_offset = offset
    Authenticator.copy(response, offset)
    offset += 16

    const encodedAttrs = Attributes.encodeList(
      this.responseAttrs,
      Client.secret,
      Authenticator
    )

    return { Code }
  }
}

export default Package