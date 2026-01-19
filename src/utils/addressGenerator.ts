import * as bip39 from 'bip39';
import { Keypair } from '@solana/web3.js';

const WORDLIST = bip39.wordlists.english;
const HARDENED_OFFSET = 0x80000000;
const ED25519_CURVE = 'ed25519 seed';
const MASK_64 = 0xffffffffffffffffn;

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    out.set(arr, offset);
    offset += arr.length;
  }
  return out;
}

function writeUint64BE(buf: Uint8Array, offset: number, value: bigint): void {
  for (let i = 7; i >= 0; i -= 1) {
    buf[offset + i] = Number(value & 0xffn);
    value >>= 8n;
  }
}

function sha512(message: Uint8Array): Uint8Array {
  const K = [
    0x428a2f98d728ae22n, 0x7137449123ef65cdn, 0xb5c0fbcfec4d3b2fn, 0xe9b5dba58189dbbcn,
    0x3956c25bf348b538n, 0x59f111f1b605d019n, 0x923f82a4af194f9bn, 0xab1c5ed5da6d8118n,
    0xd807aa98a3030242n, 0x12835b0145706fben, 0x243185be4ee4b28cn, 0x550c7dc3d5ffb4e2n,
    0x72be5d74f27b896fn, 0x80deb1fe3b1696b1n, 0x9bdc06a725c71235n, 0xc19bf174cf692694n,
    0xe49b69c19ef14ad2n, 0xefbe4786384f25e3n, 0x0fc19dc68b8cd5b5n, 0x240ca1cc77ac9c65n,
    0x2de92c6f592b0275n, 0x4a7484aa6ea6e483n, 0x5cb0a9dcbd41fbd4n, 0x76f988da831153b5n,
    0x983e5152ee66dfabn, 0xa831c66d2db43210n, 0xb00327c898fb213fn, 0xbf597fc7beef0ee4n,
    0xc6e00bf33da88fc2n, 0xd5a79147930aa725n, 0x06ca6351e003826fn, 0x142929670a0e6e70n,
    0x27b70a8546d22ffcn, 0x2e1b21385c26c926n, 0x4d2c6dfc5ac42aedn, 0x53380d139d95b3dfn,
    0x650a73548baf63den, 0x766a0abb3c77b2a8n, 0x81c2c92e47edaee6n, 0x92722c851482353bn,
    0xa2bfe8a14cf10364n, 0xa81a664bbc423001n, 0xc24b8b70d0f89791n, 0xc76c51a30654be30n,
    0xd192e819d6ef5218n, 0xd69906245565a910n, 0xf40e35855771202an, 0x106aa07032bbd1b8n,
    0x19a4c116b8d2d0c8n, 0x1e376c085141ab53n, 0x2748774cdf8eeb99n, 0x34b0bcb5e19b48a8n,
    0x391c0cb3c5c95a63n, 0x4ed8aa4ae3418acbn, 0x5b9cca4f7763e373n, 0x682e6ff3d6b2b8a3n,
    0x748f82ee5defb2fcn, 0x78a5636f43172f60n, 0x84c87814a1f0ab72n, 0x8cc702081a6439ecn,
    0x90befffa23631e28n, 0xa4506cebde82bde9n, 0xbef9a3f7b2c67915n, 0xc67178f2e372532bn,
    0xca273eceea26619cn, 0xd186b8c721c0c207n, 0xeada7dd6cde0eb1en, 0xf57d4f7fee6ed178n,
    0x06f067aa72176fban, 0x0a637dc5a2c898a6n, 0x113f9804bef90daen, 0x1b710b35131c471bn,
    0x28db77f523047d84n, 0x32caab7b40c72493n, 0x3c9ebe0a15c9bebcn, 0x431d67c49c100d4cn,
    0x4cc5d4becb3e42b6n, 0x597f299cfc657e2an, 0x5fcb6fab3ad6faecn, 0x6c44198c4a475817n
  ];

  let h0 = 0x6a09e667f3bcc908n;
  let h1 = 0xbb67ae8584caa73bn;
  let h2 = 0x3c6ef372fe94f82bn;
  let h3 = 0xa54ff53a5f1d36f1n;
  let h4 = 0x510e527fade682d1n;
  let h5 = 0x9b05688c2b3e6c1fn;
  let h6 = 0x1f83d9abfb41bd6bn;
  let h7 = 0x5be0cd19137e2179n;

  const bitLen = BigInt(message.length) * 8n;
  const withOne = message.length + 1;
  const zeros = (128 - ((withOne + 16) % 128)) % 128;
  const totalLen = withOne + zeros + 16;
  const padded = new Uint8Array(totalLen);
  padded.set(message, 0);
  padded[message.length] = 0x80;
  writeUint64BE(padded, totalLen - 16, bitLen >> 64n);
  writeUint64BE(padded, totalLen - 8, bitLen & MASK_64);

  const W = new Array<bigint>(80);

  for (let i = 0; i < padded.length; i += 128) {
    for (let t = 0; t < 16; t += 1) {
      const off = i + t * 8;
      W[t] =
        (BigInt(padded[off]) << 56n) |
        (BigInt(padded[off + 1]) << 48n) |
        (BigInt(padded[off + 2]) << 40n) |
        (BigInt(padded[off + 3]) << 32n) |
        (BigInt(padded[off + 4]) << 24n) |
        (BigInt(padded[off + 5]) << 16n) |
        (BigInt(padded[off + 6]) << 8n) |
        BigInt(padded[off + 7]);
    }
    for (let t = 16; t < 80; t += 1) {
      const s0 =
        ((W[t - 15] >> 1n) | (W[t - 15] << 63n)) ^
        ((W[t - 15] >> 8n) | (W[t - 15] << 56n)) ^
        (W[t - 15] >> 7n);
      const s1 =
        ((W[t - 2] >> 19n) | (W[t - 2] << 45n)) ^
        ((W[t - 2] >> 61n) | (W[t - 2] << 3n)) ^
        (W[t - 2] >> 6n);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) & MASK_64;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let t = 0; t < 80; t += 1) {
      const S1 =
        ((e >> 14n) | (e << 50n)) ^
        ((e >> 18n) | (e << 46n)) ^
        ((e >> 41n) | (e << 23n));
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + W[t]) & MASK_64;
      const S0 =
        ((a >> 28n) | (a << 36n)) ^
        ((a >> 34n) | (a << 30n)) ^
        ((a >> 39n) | (a << 25n));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) & MASK_64;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) & MASK_64;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) & MASK_64;
    }

    h0 = (h0 + a) & MASK_64;
    h1 = (h1 + b) & MASK_64;
    h2 = (h2 + c) & MASK_64;
    h3 = (h3 + d) & MASK_64;
    h4 = (h4 + e) & MASK_64;
    h5 = (h5 + f) & MASK_64;
    h6 = (h6 + g) & MASK_64;
    h7 = (h7 + h) & MASK_64;
  }

  const out = new Uint8Array(64);
  writeUint64BE(out, 0, h0);
  writeUint64BE(out, 8, h1);
  writeUint64BE(out, 16, h2);
  writeUint64BE(out, 24, h3);
  writeUint64BE(out, 32, h4);
  writeUint64BE(out, 40, h5);
  writeUint64BE(out, 48, h6);
  writeUint64BE(out, 56, h7);
  return out;
}

function hmacSha512(key: Uint8Array, data: Uint8Array): Uint8Array {
  const blockSize = 128;
  let k = key;
  if (k.length > blockSize) {
    k = sha512(k);
  }
  if (k.length < blockSize) {
    const padded = new Uint8Array(blockSize);
    padded.set(k, 0);
    k = padded;
  }
  const oKey = new Uint8Array(blockSize);
  const iKey = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i += 1) {
    const b = k[i];
    oKey[i] = b ^ 0x5c;
    iKey[i] = b ^ 0x36;
  }
  const inner = sha512(concatBytes(iKey, data));
  return sha512(concatBytes(oKey, inner));
}

function deriveEd25519Path(path: string, seed: Uint8Array): Uint8Array {
  const parts = path.split('/');
  if (parts[0] !== 'm') {
    throw new Error('Invalid derivation path');
  }

  let I = hmacSha512(new TextEncoder().encode(ED25519_CURVE), seed);
  let key = I.slice(0, 32);
  let chainCode = I.slice(32);

  for (let i = 1; i < parts.length; i += 1) {
    const part = parts[i];
    if (!part.endsWith("'")) {
      throw new Error('Non-hardened path segments are not supported for ed25519');
    }
    const index = Number(part.slice(0, -1));
    if (!Number.isInteger(index) || index < 0) {
      throw new Error('Invalid path index');
    }
    const data = new Uint8Array(1 + key.length + 4);
    data[0] = 0x00;
    data.set(key, 1);
    const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
    dv.setUint32(1 + key.length, index + HARDENED_OFFSET, false);
    I = hmacSha512(chainCode, data);
    key = I.slice(0, 32);
    chainCode = I.slice(32);
  }

  return key;
}

export function generateMnemonic(): string[] {
  let words: string[] = [];
  do {
    words = bip39.generateMnemonic(128, undefined, WORDLIST).split(' ');
  } while (new Set(words).size !== words.length);
  return words;
}

export function derivePublicAddress(mnemonic: string[]): string {
  if (!Array.isArray(mnemonic) || mnemonic.length !== 12) {
    throw new Error('Mnemonic must be 12 words');
  }
  const wordSet = new Set(WORDLIST);
  if (new Set(mnemonic).size !== mnemonic.length) {
    throw new Error('Mnemonic contains duplicate words');
  }
  for (const word of mnemonic) {
    if (!wordSet.has(word)) {
      throw new Error('Mnemonic contains invalid words');
    }
  }
  const phrase = mnemonic.join(' ');
  if (!bip39.validateMnemonic(phrase, WORDLIST)) {
    throw new Error('Invalid mnemonic');
  }
  const seed = bip39.mnemonicToSeedSync(phrase);
  const derived = deriveEd25519Path("m/44'/501'/0'/0'", new Uint8Array(seed));
  return Keypair.fromSeed(derived).publicKey.toBase58();
}
