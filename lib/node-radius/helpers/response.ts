import { EventEmitter } from 'events'
import { debug } from './logger'

import { IResponse } from '../types'

const eventEmitter = new EventEmitter()

const codeRelations: IResponse.RelationMap = {
  1: {
    accept: { code: 2, name: 'Access-Accept' },
    reject: { code: 3, name: 'Access-Reject' },
    default: { code: 3, name: 'Access-Reject' },
    allows: [2, 3],
  },

  4: {
    default: { code: 5, name: 'Accounting-Response' },
    allows: [5],
  },
}

export default class Response {
  packet: any
  request: any
  code: any

  constructor(packet) {
    let code

    // ? Makes the package read-only for secure Incoming Package Data
    Object.defineProperties(this, {
      packet: {
        value: packet,
      },
      request: {
        value: packet.request,
      },
      code: {
        set: value => (code = this.checkCode(value)),
        get: () => code,
      },
    })
  }

  checkCode(code) {
    const codeId = this.packet.getCodeId(code)
    const reqCodeId = this.request.CodeId

    if (!codeId) throw Error(`${code}: Code is invalid`)

    if (!codeRelations[reqCodeId] || !codeRelations[reqCodeId].allows.includes(codeId)) {
      throw Error(
        `You can not response with ${code} to ${this.packet.getCodeName(
          reqCodeId
        )} package.`
      )
    }

    return code
  }

  /**
   *
   * @param {Boolean} sendAfter
   * @default false
   * @description if set true, after set response code, it will send response automatically.
   */
  reject(sendAfter = false) {
    const reqCodeId = this.request.CodeId
    const Code = codeRelations[reqCodeId].reject || codeRelations[reqCodeId].default

    this.code = Code.name

    if (sendAfter) this.send()
  }

  /**
   *
   * @param {Boolean} sendAfter
   * @default false
   * @description if set true, after set response code, it will send response automatically.
   */
  accept(sendAfter = false) {
    const reqCodeId = this.request.CodeId
    const Code = codeRelations[reqCodeId].accept || codeRelations[reqCodeId].default

    this.code = Code.name

    if (sendAfter) this.send()
  }

  /**
   *
   * @param {String} attr
   * @param {any} value
   * @return {Boolean|Error}
   * @description Add Response Attrs depends on loaded dictionaries
   * @example set('Framed-IP-Address', '192.168.3.3')
   */
  add(type, value) {
    this.packet.addAttribute(type, value)
  }

  /** @TODO add remove method for attributes */
  on(eventName: string, fn: IResponse.SocketListener) {
    eventEmitter.on(eventName, fn)
  }

  send() {
    if (!this.code) {
      this.reject()

      debug(`You should define a response code!`)
      debug(`Request will automatically responded (${this.code}) code.`)
    }

    const responsePacket = this.packet.encode(this.code)

    eventEmitter.emit(
      'send',
      responsePacket,
      this.request.Client.connection.port,
      this.request.Client.ip
    )
  }
}
