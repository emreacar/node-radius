export default class Request {
  client: any
  code: any
  codeId: any
  data: any

  constructor(requestPackage: Record<string, any>) {
    const { Client, Code, CodeId, Attr } = requestPackage

    this.client = Client
    this.code = Code
    this.codeId = CodeId
    this.data = Attr
  }
}
