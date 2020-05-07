const AttributeList = require('./attributes')
const debugMsg = require('debug')('debug')

const requestCodes = [
  [1, 'Access-Request' ],
  [2, 'Access-Accept' ],
  [3, 'Access-Reject' ],
  [4, 'Accounting-Request' ],
  [5, 'Accounting-Response' ],
  [11, 'Access-Challenge' ],
  [12, 'Status-Server' ],
  [13, 'Status-Client' ]
]

const codeMap = new Map(requestCodes)

class Request {
  constructor(buffer, rinfo, secret= '') {
    this.client = rinfo.address
    this.secret = secret
    this.errors = []
    this.data = {}

    if (this.bufferValidate(buffer)) {
      this.packageDecode(buffer)
    }
  }

  bufferValidate(buffer) {
    if (buffer.length < 20) {
      debugMsg(`Package size too short from NAS ${this.client.address}:${this.client.port}`)
      return false
    }

    if (buffer.length < buffer.readUInt16BE(2)) {
      debugMsg(`Package size mismatch`)
      return false
    }

    return true
  }

  packageDecode(buffer) {
    const Code = codeMap.get(buffer[0])
    const Identifier = buffer[1]
    const Authenticator = buffer.slice(4, 20)
    const Attributes = []

    this.data = { Code, Identifier, Authenticator, Attributes }
  }
}

export default Request