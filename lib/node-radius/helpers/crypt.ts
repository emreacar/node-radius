import crypto from 'crypto';

export default class Crypt {
  static md5(secret, chunk) {
    const hash = crypto.createHash('md5');

    hash.update(secret);
    hash.update(chunk);

    return hash.digest();
  }

  static decode(value: Buffer, secret: String, Authenticator: Buffer) {
    if (value.length < 16 || value.length > 128 || value.length % 16 !== 0) {
      throw new Error('Wrong Length for Encrypted Value');
    }

    /**
     * Call the shared secret S and the pseudo-random 128-bit Request
      Authenticator RA.  Break the password into 16-octet chunks p1, p2,
      etc.  with the last one padded at the end with nulls to a 16-octet
      boundary.  Call the ciphertext blocks c(1), c(2), etc.  We'll need
      intermediate values b1, b2, etc.

         b1 = MD5(S + RA)       c(1) = p1 xor b1
         b2 = MD5(S + c(1))     c(2) = p2 xor b2
                .                       .
                .                       .
         bi = MD5(S + c(i-1))   c(i) = pi xor bi

      The String will contain c(1)+c(2)+...+c(i) where + denotes
      concatenation.
     */

    const p = Buffer.alloc(value.length);
    const c = Buffer.from(value);

    for (let i = 0; i < value.length; i += 16) {
      const chunk = i === 0 ? Authenticator : c.slice(i - 16, i);
      const b = Crypt.md5(secret, chunk);

      for (let x = 0; x < 16; ++x) {
        p[i + x] = c[i + x] ^ b[x];
      }
    }

    let l = p.length;

    while (l && p[l - 1] === 0) {
      l--;
    }
    return p.slice(0, l);
  }

  static encode(value) {
    return value;
  }
}
