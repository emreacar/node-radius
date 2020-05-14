class Request {
  /**
   *
   * @param {Object} reqPackage
   * @returns {Object}
   */
  constructor({Client, Code, CodeId, Attr} = reqPackage) {
    this.client = Client
    this.code = Code
    this.codeId = CodeId
    this.data = Attr
  }
}

export default Request