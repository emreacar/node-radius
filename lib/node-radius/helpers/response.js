const debugMsg = require('debug')('debug')

const codeMap = new Map([
  [2, 'Access-Accept' ],
  [3, 'Access-Reject' ],
  [5, 'Accounting-Response' ],
  [11, 'Access-Challenge' ],
  [13, 'Status-Client' ]
])

class Response {
  constructor(buffer, client) {
    this.client = client
    this.code = ''
  }

  end() {
    return true
  }
}

export default Response
