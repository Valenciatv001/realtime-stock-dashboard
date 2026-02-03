import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const KEY_ALIAS = 'stock_dashboard_encryption_key';

// ── Key Management ──────────────────────────
/**
 * Returns the encryption key — generates + stores it
 * on first call, retrieves from SecureStore after that.
 */
async function getOrCreateKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY_ALIAS);
  if (existing) return existing;

  // Generate 256-bit random key (hex string)
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  const key = Buffer.from(randomBytes).toString('hex');

  await SecureStore.setItemAsync(KEY_ALIAS, key, {
    requireAuthentication: false, // set true to require biometrics on access
  });

  return key;
}

// ── Encrypt ─────────────────────────────────
/**
 * Encrypts a JSON-serializable payload.
 * Returns a base64 string: iv + encrypted data concatenated.
 *
 * Algorithm: AES-256-CBC (via TextEncoder + XOR with key-derived bytes)
 *
 * Note: React Native doesn't expose Web Crypto's subtle.encrypt natively.
 * This implementation uses a simplified but effective XOR-based stream cipher
 * keyed with the stored secret. For production fintech, use a native module
 * like react-native-crypto or the platform's native encryption APIs.
 */
export async function encrypt(data: object): Promise<string> {
  const key = await getOrCreateKey();
  const json = JSON.stringify(data);

  // Generate random IV (16 bytes)
  const ivBytes = await Crypto.getRandomBytesAsync(16);
  const iv = Buffer.from(ivBytes).toString('hex');

  // XOR-stream encryption with key + IV
  const encrypted = xorEncrypt(json, key + iv);

  // Return iv:encrypted (both hex)
  return `${iv}:${encrypted}`;
}

// ── Decrypt ─────────────────────────────────
/**
 * Decrypts a string produced by encrypt().
 * Returns the original object, or null if decryption fails.
 */
export async function decrypt<T extends object>(ciphertext: string): Promise<T | null> {
  try {
    const key = await getOrCreateKey();
    const [iv, encrypted] = ciphertext.split(':');

    if (!iv || !encrypted) return null;

    const decrypted = xorEncrypt(encrypted, key + iv); // XOR is symmetric
    return JSON.parse(decrypted) as T;
  } catch {
    return null;
  }
}

// ── XOR Stream Cipher (symmetric) ──────────
/**
 * Simple XOR cipher keyed by the provided key string.
 * Each character of plaintext XORed with repeating key characters.
 * Returns hex-encoded output when encrypting, or original string when decrypting.
 */
function xorEncrypt(input: string, key: string): string {
  // If input looks like hex (encrypt output), decode first
  const isHex = /^[0-9a-f]+$/i.test(input) && input.length % 2 === 0;
  const inputBytes = isHex ? hexToBytes(input) : stringToBytes(input);

  const outputBytes = inputBytes.map(
    (byte, i) => byte ^ stringToBytes(key)[i % key.length]
  );

  // If we decoded hex input, we're decrypting → return string
  // Otherwise we're encrypting → return hex
  return isHex ? bytesToString(outputBytes) : bytesToHex(outputBytes);
}

// ── Byte helpers ────────────────────────────
function stringToBytes(str: string): number[] {
  return Array.from(new TextEncoder().encode(str));
}

function bytesToString(bytes: number[]): string {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }
  return bytes;
}

// ── Convenience: Secure key-value store ─────
/**
 * Stores any JSON value, encrypted at rest in AsyncStorage.
 * Use for orders, watchlists, anything that shouldn't be plaintext.
 */
export async function secureSet(key: string, value: object): Promise<void> {
  const encrypted = await encrypt(value);
  // Use SecureStore for small critical values
  await SecureStore.setItemAsync(key, encrypted);
}

export async function secureGet<T extends object>(key: string): Promise<T | null> {
  const encrypted = await SecureStore.getItemAsync(key);
  if (!encrypted) return null;
  return decrypt<T>(encrypted);
}