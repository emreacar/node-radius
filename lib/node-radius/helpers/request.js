import Package from './package'

const debugMsg = require('debug')('debug')

class Request {
  constructor(buffer, client) {
    this.client = client

    if (Package.validate(buffer)) {
      const { Code, Attr } = Package.decode(buffer, client.secret)
      this.attr = Attr
      this.code = Code
    } else {
      debugMsg('The incoming package could not be validated.')
    }
  }
}

export default Request