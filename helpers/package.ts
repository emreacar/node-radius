import { ICode } from './../types'
import crypto from 'crypto'
import { getSock } from './listen'
import { debug } from './logger'
import Attributes from './attributes'
import Dictionary from './dictionary'
import Code from './code'

const identifierCheck = identifier => {
  if (typeof identifier !== 'number' || Number(identifier) < 0) {
    throw new Error(
      `Packet Identifier must be unsigned integer. ${typeof identifier} given in.`
    )
  }

  return identifier
}
export default class Package {
  code: ICode.CodeEntry
  client: { [key: string]: any }
  identifier: number
  authenticator: any
  attr: {}
  responseAttr: [any]
  requestCode: ICode.CodeEntry

  constructor(
    code = null,
    identifier = null,
    authenticator = null,
    client = {},
    attr = {}
  ) {
    code = Code.validate(code)
    identifier = identifierCheck(identifier)

    Object.defineProperties(this, {
      code: {
        get: () => code,
        set: value => (code = Code.validate(value))
      },

      identifier: {
        get: () => identifier,
        set: value => (identifier = identifierCheck(value))
      },

      authenticator: {
        get: () => authenticator.slice(0),
        set: value => (authenticator = value)
      },

      attr: {
        value: attr
      },

      responseAttr: {
        value: []
      },

      client: {
        value: client,
        writable: true
      }
    })
  }

  reject(sendAfter = false) {
    this.code = Code.rejectOf(this.requestCode.id)

    if (sendAfter) this.send()
  }

  accept(sendAfter = false) {
    this.code = Code.acceptOf(this.requestCode.id)

    if (sendAfter) this.send()
  }

  checkCode() {
    const canResponse = Code.canResponseWith(this.requestCode.id, this.code.id)

    if (!canResponse) {
      throw Error(
        `You can not response to the ${this.requestCode.name} with the ${this.code.name} code.`
      )
    }

    return canResponse
  }

  add(type, value) {
    const attribute = Dictionary.get(type)

    if (!attribute) {
      throw Error(`${type} is unknown attribute...`)
    }

    this.responseAttr.push({
      attribute,
      value
    })
  }

  toBuffer(): Buffer {
    let offset = 0
    let BufferData = Buffer.alloc(4096)

    offset = BufferData.writeUInt8(this.code.id, 0)
    offset = BufferData.writeUInt8(this.identifier, offset)

    const length_offset = offset
    offset = BufferData.writeUInt16BE(0, offset)

    const authenticator_offset = offset
    this.authenticator.copy(BufferData, offset)
    offset += 16 //Because Authenticator Length is 16

    const attrBuffer = Attributes.encodeList(this.responseAttr)
    attrBuffer.copy(BufferData, offset)

    offset += attrBuffer.length

    const packageLength = offset
    BufferData.writeUInt16BE(packageLength, length_offset)
    BufferData = BufferData.slice(0, packageLength)

    // restore Authentication
    const hash = crypto
      .createHash('md5')
      .update(BufferData)
      .update(this.client.secret)
      .digest('binary' as any)

    const AuthenticationBuffer = Buffer.from(hash, 'binary')
    AuthenticationBuffer.copy(BufferData, authenticator_offset)

    return BufferData
  }

  setClient(client) {
    this.client = { ...client }
  }

  send() {
    if (!this.code) {
      this.reject()

      debug(`You should define a response code!`)
      debug(`The request will be responded automatically with the (${this.code}) code.`)
    }

    if (this.requestCode) this.checkCode()

    if (Object.keys(this.client).length === 0) {
      throw new Error('You must select a client to be able to send packages.')
    }

    const responsePacket = this.toBuffer()
    const { socket, connection } = this.client

    if (this.requestCode) {
      socket.send(responsePacket, connection.port, this.client.ip)
    } else {
      const requestSocket = getSock('request')
      requestSocket.send(responsePacket, this.client.requestPort, this.client.ip)
    }
  }

  static fromBuffer(buffer, client) {
    if (buffer.length < 20) {
      throw new Error(`PACKAGE too short from ${client.address}`)
    }

    if (buffer.length < buffer.readUInt16BE(2)) {
      throw new Error(`Package sizes do not mismatch with length`)
    }

    const length = buffer.readUInt16BE(2)
    const code = buffer.readUInt8(0)
    const identifier = buffer[1]
    const authenticator = buffer.slice(4, 20)
    const attr = Attributes.decodeList(
      buffer.slice(20, length),
      client.secret,
      authenticator
    )

    return new Package(code, identifier, authenticator, client, attr)
  }

  static fromRequest(request) {
    const { code, identifier, authenticator, client } = request

    /**
     * Because if the user doesn't define an answer code, we should return a reject answer by default.
     */

    const resCode = Code.rejectOf(code.id)
    let resCodeId = resCode.id || 0

    const packet = new Package(resCodeId, identifier, authenticator, client)

    Object.defineProperties(packet, {
      requestCode: {
        value: code
      }
    })

    return packet
  }

  create(code: string | number) {
    if (!code || !Code.get(code)) {
      throw Error(`${code} is unknown`)
    }

    const identifier = Math.floor(Math.random() * 256)
    const authenticator = Buffer.alloc(16)

    authenticator.fill(0x00)

    return new Package(code, identifier, authenticator)
  }
}
