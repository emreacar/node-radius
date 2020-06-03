import Packet from './package'
import Dictionary from './dictionary'
import Code from './code'
import { debug } from './logger'

export default class Response {
  request: any
  code: any
  socket: any
  data: any

  constructor(request, socket) {
    let code

    Object.defineProperties(this, {
      request: {
        value: request
      },

      code: {
        get: () => code,
        set: value => (code = Code.get(value))
      },

      socket: {
        value: socket
      },

      data: {
        value: []
      }
    })
  }

  /**
   *
   * @param {String} attr
   * @param {any} value
   * @description Add Response Attrs depends on loaded dictionaries
   * @example add('Framed-IP-Address', '192.168.3.3')
   */
  add(type, value) {
    const attribute = Dictionary.get(type)

    if (!attribute) {
      throw Error(`${type} is unknown attribute...`)
    }

    this.data.push({
      attribute,
      value
    })
  }

  checkCode() {
    const canResponse = Code.canResponseWith(this.request.code.id, this.code.id)

    if (!canResponse) {
      throw Error(
        `You can not response with ${this.code.name} to ${this.request.code.name} package.`
      )
    }

    return canResponse
  }

  /**
   *
   * @param {Boolean} sendAfter
   * @default false
   * @description if set true, after set response code, it will send response automatically.
   */
  reject(sendAfter = false) {
    const reqCode = this.request.code
    this.code = Code.rejectOf(reqCode.id)

    if (sendAfter) this.send()
  }

  /**
   *
   * @param {Boolean} sendAfter
   * @default false
   * @description if set true, after set response code, it will send response automatically.
   */
  accept(sendAfter = false) {
    const reqCode = this.request.code
    this.code = Code.acceptOf(reqCode.id)

    if (sendAfter) this.send()
  }

  send() {
    if (!this.code) {
      this.reject()

      debug(`You should define a response code!`)
      debug(`Request will automatically responded (${this.code}) code.`)
    }

    this.checkCode()

    const { identifier, authenticator, client } = this.request
    const responsePacket = Packet.toBuffer(
      this.code,
      identifier,
      authenticator,
      this.data,
      client
    )

    this.socket.send(responsePacket, client.connection.port, client.ip)
  }
}
