import { ICode } from './../types'

const codes: ICode.Code = [
  { id: 1, name: 'Access-Request', accept: 2, reject: 3, default: 3, allows: [2, 3] },
  { id: 2, name: 'Access-Accept' },
  { id: 3, name: 'Access-Reject' },
  { id: 4, name: 'Accounting-Request', default: 5, allows: [5] },
  { id: 5, name: 'Accounting-Response' },
  { id: 11, name: 'Access-Challenge' },
  { id: 12, name: 'Status-Server' },
  { id: 13, name: 'Status-Client' },
  { id: 40, name: 'Disconnect-Request' },
  { id: 41, name: 'Disconnect-ACK' },
  { id: 42, name: 'Disconnect-NAK' },
  { id: 43, name: 'CoA-Request' },
  { id: 44, name: 'CoA-ACK' },
  { id: 45, name: 'CoA-NAK' }
]

const CodeDict = new Map()

codes.forEach(value => {
  CodeDict.set(value.id, value)
  CodeDict.set(value.name, value)
})

const Code = {
  get: (value: number | string): ICode.CodeEntry => {
    return CodeDict.get(value)
  },

  validate: (value): ICode.CodeEntry => {
    if (Number.isInteger(value) || typeof value === 'string') {
      value = Code.get(value)
    } else if (value.id) {
      value = Code.get(value.id)
    } else {
      throw Error('Unknown Code Defination')
    }

    return value
  },

  rejectOf: (id: number): ICode.CodeEntry => {
    const reqCode = CodeDict.get(id)
    const resCodeId = reqCode.reject || reqCode.default

    return CodeDict.get(resCodeId)
  },

  acceptOf: (id: number): ICode.CodeEntry => {
    const reqCode = CodeDict.get(id)
    const resCodeId = reqCode.accept || reqCode.default

    return CodeDict.get(resCodeId)
  },

  canResponseWith: (reqCodeId: number, resCodeId: number): boolean => {
    const reqCode = CodeDict.get(reqCodeId)

    if (reqCode.allows && reqCode.allows.includes(resCodeId)) {
      return true
    }

    return false
  }
}

export default Code
