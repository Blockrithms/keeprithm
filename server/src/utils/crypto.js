const crypto = require('crypto');
const config = require('../config/config');

const CIPHERTEXT_PREFIX = 'enc:v1:';
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const MIN_WORD_LEN = 2;
const MAX_PREFIX_LEN = 12;
const MAX_WORDS_INDEXED = 80;

const masterKey = Buffer.from(config.encryption.masterKeyHex, 'hex');
if (masterKey.length !== 32) {
  throw new Error('ENCRYPTION_KEY must decode to exactly 32 bytes (64 hex chars)');
}

// Derive independent domain-separated sub-keys from the single master key.
const contentKey = Buffer.from(
  crypto.hkdfSync('sha256', masterKey, Buffer.alloc(0), Buffer.from('slack-exporter:aes-gcm:v1'), 32)
);
const searchKey = Buffer.from(
  crypto.hkdfSync('sha256', masterKey, Buffer.alloc(0), Buffer.from('slack-exporter:search-hmac:v1'), 32)
);

const isEncrypted = (value) => typeof value === 'string' && value.startsWith(CIPHERTEXT_PREFIX);

/**
 * Encrypt a UTF-8 string with AES-256-GCM using a fresh 96-bit random IV.
 * Idempotent: already-encrypted strings pass through unchanged so Mongoose
 * setters can never double-encrypt.
 */
const encryptString = (plaintext) => {
  if (plaintext === null || plaintext === undefined) return plaintext;
  const str = String(plaintext);
  if (isEncrypted(str)) return str;

  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, contentKey, iv, { authTagLength: AUTH_TAG_BYTES });
  const encrypted = Buffer.concat([cipher.update(str, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const packed = Buffer.concat([iv, authTag, encrypted]).toString('base64');
  return `${CIPHERTEXT_PREFIX}${packed}`;
};

/**
 * Decrypt an `enc:v1:` payload. Plaintext legacy values pass through as-is
 * until the one-time `encryptExistingData` migration has been run.
 */
const decryptString = (ciphertext) => {
  if (ciphertext === null || ciphertext === undefined) return ciphertext;
  if (typeof ciphertext !== 'string' || !isEncrypted(ciphertext)) return ciphertext;

  const packed = Buffer.from(ciphertext.slice(CIPHERTEXT_PREFIX.length), 'base64');
  if (packed.length < IV_BYTES + AUTH_TAG_BYTES) {
    throw new Error('Malformed encrypted payload: truncated buffer');
  }

  const iv = packed.subarray(0, IV_BYTES);
  const authTag = packed.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
  const data = packed.subarray(IV_BYTES + AUTH_TAG_BYTES);

  const decipher = crypto.createDecipheriv(ALGORITHM, contentKey, iv, { authTagLength: AUTH_TAG_BYTES });
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
};

/**
 * Encrypt a JSON-serializable value (arrays/objects such as message `files` or
 * `reactions`) into a single `enc:v1:` string for storage.
 */
const encryptJson = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string' && isEncrypted(value)) return value;
  return encryptString(JSON.stringify(value));
};

/**
 * Decrypt an encrypted JSON field back to its structured value, gracefully
 * returning legacy unencrypted arrays/objects unchanged.
 */
const decryptJson = (value, fallback = []) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  if (!isEncrypted(value)) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  const json = decryptString(value);
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};

const tokenizeWords = (text) => {
  if (!text || typeof text !== 'string') return [];
  const plain = isEncrypted(text) ? decryptString(text) : text;
  const matches = plain.toLowerCase().match(/[\p{L}\p{N}_-]+/gu);
  return matches || [];
};

const hmacToken = (token) => crypto.createHmac('sha256', searchKey).update(token, 'utf8').digest('base64url').slice(0, 16);

/**
 * Build deterministic HMAC-SHA256 blind-index tokens over word prefixes so
 * encrypted messages remain searchable without storing any plaintext.
 */
const buildSearchIndex = (text) => {
  const words = tokenizeWords(text);
  if (!words.length) return [];

  const uniqueWords = [...new Set(words)].slice(0, MAX_WORDS_INDEXED);
  const hashes = new Set();

  uniqueWords.forEach((word) => {
    if (word.length < MIN_WORD_LEN) return;
    const maxLen = Math.min(word.length, MAX_PREFIX_LEN);
    for (let len = MIN_WORD_LEN; len <= maxLen; len += 1) {
      hashes.add(hmacToken(word.slice(0, len)));
    }
    if (word.length > MAX_PREFIX_LEN) {
      hashes.add(hmacToken(word));
    }
  });

  return [...hashes];
};

/**
 * Hash a user's search query into blind-index lookup tokens. Every query term
 * must match at least one indexed word/prefix (`$all`).
 */
const buildQueryTokens = (query) => {
  const words = tokenizeWords(query)
    .filter((w) => w.length >= MIN_WORD_LEN)
    .slice(0, 12);

  return [...new Set(words.map((word) => hmacToken(word)))];
};

module.exports = {
  CIPHERTEXT_PREFIX,
  isEncrypted,
  encryptString,
  decryptString,
  encryptJson,
  decryptJson,
  buildSearchIndex,
  buildQueryTokens,
};
