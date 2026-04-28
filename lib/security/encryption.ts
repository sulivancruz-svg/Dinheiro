import CryptoJS from "crypto-js";

/**
 * Encrypts plaintext using AES encryption
 * @param plaintext - Data to encrypt
 * @param key - Encryption key (min 8 chars)
 * @returns Encrypted ciphertext
 * @throws Error if plaintext or key is empty
 */
export function encryptData(plaintext: string, key: string): string {
  if (!plaintext || !key) {
    throw new Error("Plaintext and key are required for encryption");
  }
  const encrypted = CryptoJS.AES.encrypt(plaintext, key);
  return encrypted.toString();
}

/**
 * Decrypts ciphertext using AES decryption
 * @param ciphertext - Encrypted data
 * @param key - Encryption key
 * @returns Decrypted plaintext
 * @throws Error if decryption fails or data is corrupted
 */
export function decryptData(ciphertext: string, key: string): string {
  if (!ciphertext || !key) {
    throw new Error("Ciphertext and key are required for decryption");
  }
  try {
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    if (!plaintext) {
      throw new Error("Decryption failed: Invalid ciphertext or wrong key");
    }
    return plaintext;
  } catch (error) {
    throw new Error(
      `Decryption error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generates SHA256 hash of data
 * @param data - Data to hash
 * @returns Hex-encoded hash
 * @throws Error if data is empty
 */
export function hashData(data: string): string {
  if (!data) {
    throw new Error("Data is required for hashing");
  }
  return CryptoJS.SHA256(data).toString();
}
