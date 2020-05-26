"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
class Crypt {
    static md5(secret, chunk) {
        const hash = crypto_1.default.createHash('md5');
        hash.update(secret);
        hash.update(chunk);
        return hash.digest();
    }
    static decode(value, secret, Authenticator) {
        if (value.length < 16 || value.length > 128 || value.length % 16 !== 0) {
            throw new Error('Wrong Length for Encrypted Value');
        }
        const p = Buffer.alloc(value.length);
        const c = Buffer.from(value);
        for (let i = 0; i < value.length; i += 16) {
            const chunk = i === 0 ? Authenticator : c.slice(i - 16, i);
            const b = Crypt.md5(secret, chunk);
            for (let x = 0; x < 16; ++x) {
                p[i + x] = c[i + x] ^ b[x];
            }
        }
        const cut = p.reverse().findIndex(data => data !== 0);
        return p.slice(cut, p.length).reverse();
    }
    static encode(value) {
        return value;
    }
}
exports.default = Crypt;
//# sourceMappingURL=crypt.js.map