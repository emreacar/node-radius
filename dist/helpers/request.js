"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Request {
    constructor(requestPackage) {
        const { Client, Code, CodeId, Attr } = requestPackage;
        this.client = Client;
        this.code = Code;
        this.codeId = CodeId;
        this.data = Attr;
    }
}
exports.default = Request;
//# sourceMappingURL=request.js.map