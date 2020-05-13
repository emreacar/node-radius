import Attributes from './attributes'

const debugMsg = require('debug')('debug')

const codeMap = new Map([
  [1, 'Access-Request' ],
  [4, 'Accounting-Request' ],
  [11, 'Access-Challenge' ],
  [12, 'Status-Server' ]
])

const Package = {
  /**
   * @param {Buffer} buffer
   * @returns {Boolean} true|false
   */
  validate: (buffer) => {
    if (buffer.length < 20) {
      debugMsg(`PACKAGE too short from ${this.client.address}`)

      return false
    }
    if (buffer.length < buffer.readUInt16BE(2)) {
      debugMsg(`Package sizes do not mismatch`)

      return false
    }

    return true
  },
  /**
   * @param {Buffer} buffer
   * @param {String} secret
   * @returns {Object} Decoded Package Object
   */
  decode: (buffer, secret) => {
    const Length = buffer.readUInt16BE(2)
    const Identifier = buffer[1]
    const Authenticator = buffer.slice(4, 20)
    const Code = codeMap.get(buffer.readUInt8(0))

    const Attr = Attributes.decodeList(
      buffer.slice(20, Length),
      secret,
      Authenticator
    )

    return {
      Length,
      Identifier,
      Authenticator,
      Code,
      Attr
    }
  }
}

export default Package