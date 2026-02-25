// ============================================================
// secretsVault.ts -- Encrypted environment variable management
// Uses the Web Crypto API (AES-GCM + PBKDF2) for client-side
// secret storage backed by localStorage.
// ============================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VaultEntry = {
  key: string;
  encryptedValue: string;
  createdAt: string;
  updatedAt: string;
  masked: boolean; // always true for display
};

export type VaultConfig = {
  entries: VaultEntry[];
  masterKeyHash: string; // SHA-256 hash of master password
  version: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const VAULT_KEY = "f9_secrets_vault_v1";
export const SALT_KEY = "f9_vault_salt_v1";

const PBKDF2_ITERATIONS = 100_000;
const AES_KEY_LENGTH = 256;
const IV_BYTE_LENGTH = 12; // 96-bit IV for AES-GCM

// ---------------------------------------------------------------------------
// Helpers -- SSR guard
// ---------------------------------------------------------------------------

function getCrypto(): SubtleCrypto | null {
  if (
    typeof window !== "undefined" &&
    window.crypto &&
    window.crypto.subtle
  ) {
    return window.crypto.subtle;
  }
  return null;
}

function getRandomValues(length: number): Uint8Array {
  if (typeof window !== "undefined" && window.crypto) {
    return window.crypto.getRandomValues(new Uint8Array(length));
  }
  throw new Error("Web Crypto API is not available (SSR environment).");
}

// ---------------------------------------------------------------------------
// Base64 encode / decode helpers (Uint8Array <-> string)
// ---------------------------------------------------------------------------

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Core crypto functions
// ---------------------------------------------------------------------------

/**
 * Derive an AES-GCM 256-bit key from a password and salt using PBKDF2
 * (100 000 iterations, SHA-256).
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const subtle = getCrypto();
  if (!subtle) {
    throw new Error("Web Crypto API is not available (SSR environment).");
  }

  const encoder = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: AES_KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * AES-GCM encrypt. Returns base64(iv + ciphertext).
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey,
): Promise<string> {
  const subtle = getCrypto();
  if (!subtle) {
    throw new Error("Web Crypto API is not available (SSR environment).");
  }

  const encoder = new TextEncoder();
  const iv = getRandomValues(IV_BYTE_LENGTH);

  const cipherBuffer = await subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    encoder.encode(plaintext),
  );

  // Concatenate iv + ciphertext into a single buffer
  const cipherBytes = new Uint8Array(cipherBuffer);
  const combined = new Uint8Array(iv.length + cipherBytes.length);
  combined.set(iv, 0);
  combined.set(cipherBytes, iv.length);

  return uint8ToBase64(combined);
}

/**
 * AES-GCM decrypt from base64(iv + ciphertext).
 */
export async function decrypt(
  encrypted: string,
  key: CryptoKey,
): Promise<string> {
  const subtle = getCrypto();
  if (!subtle) {
    throw new Error("Web Crypto API is not available (SSR environment).");
  }

  const combined = base64ToUint8(encrypted);
  const iv = combined.slice(0, IV_BYTE_LENGTH);
  const cipherBytes = combined.slice(IV_BYTE_LENGTH);

  const plainBuffer = await subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    cipherBytes.buffer as ArrayBuffer,
  );

  return new TextDecoder().decode(plainBuffer);
}

/**
 * SHA-256 hash of a password, returned as a lowercase hex string.
 */
export async function hashPassword(password: string): Promise<string> {
  const subtle = getCrypto();
  if (!subtle) {
    throw new Error("Web Crypto API is not available (SSR environment).");
  }

  const encoder = new TextEncoder();
  const hashBuffer = await subtle.digest("SHA-256", encoder.encode(password));
  const hashArray = new Uint8Array(hashBuffer);

  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// Vault persistence (localStorage)
// ---------------------------------------------------------------------------

/**
 * Load the vault configuration from localStorage.
 * Returns null when no vault has been initialised or in SSR.
 */
export function loadVault(): VaultConfig | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VaultConfig;
  } catch {
    return null;
  }
}

/**
 * Persist the vault configuration to localStorage.
 */
export function saveVault(vault: VaultConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
}

/**
 * Returns true if a vault already exists in localStorage.
 */
export function isVaultInitialized(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(VAULT_KEY) !== null;
}

// ---------------------------------------------------------------------------
// Salt helpers
// ---------------------------------------------------------------------------

function loadSalt(): Uint8Array | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SALT_KEY);
  if (!raw) return null;
  return base64ToUint8(raw);
}

function saveSalt(salt: Uint8Array): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SALT_KEY, uint8ToBase64(salt));
}

// ---------------------------------------------------------------------------
// Vault management
// ---------------------------------------------------------------------------

/**
 * Create a brand-new vault, generating a random salt and storing
 * the SHA-256 hash of the master password.
 */
export async function initVault(
  masterPassword: string,
): Promise<VaultConfig> {
  const salt = getRandomValues(16);
  saveSalt(salt);

  const masterKeyHash = await hashPassword(masterPassword);

  const vault: VaultConfig = {
    entries: [],
    masterKeyHash,
    version: 1,
  };

  saveVault(vault);
  return vault;
}

/**
 * Verify the master password against the stored hash and, if valid,
 * derive the AES-GCM key and return it together with the vault.
 * Returns null when the password is wrong or no vault exists.
 */
export async function unlockVault(
  masterPassword: string,
): Promise<{ key: CryptoKey; vault: VaultConfig } | null> {
  const vault = loadVault();
  if (!vault) return null;

  const salt = loadSalt();
  if (!salt) return null;

  const hash = await hashPassword(masterPassword);
  if (hash !== vault.masterKeyHash) return null;

  const key = await deriveKey(masterPassword, salt);
  return { key, vault };
}

/**
 * Encrypt a new secret and add (or update) it in the vault.
 * Returns the updated vault (also persisted to localStorage).
 */
export async function addSecret(
  vault: VaultConfig,
  key: CryptoKey,
  name: string,
  value: string,
): Promise<VaultConfig> {
  const encryptedValue = await encrypt(value, key);
  const now = new Date().toISOString();

  const existingIndex = vault.entries.findIndex((e) => e.key === name);

  if (existingIndex >= 0) {
    // Update existing entry
    vault.entries[existingIndex] = {
      key: name,
      encryptedValue,
      createdAt: vault.entries[existingIndex].createdAt,
      updatedAt: now,
      masked: true,
    };
  } else {
    // Add new entry
    vault.entries.push({
      key: name,
      encryptedValue,
      createdAt: now,
      updatedAt: now,
      masked: true,
    });
  }

  saveVault(vault);
  return vault;
}

/**
 * Decrypt and return a single secret by name.
 * Returns null when the entry does not exist.
 */
export async function getSecret(
  vault: VaultConfig,
  key: CryptoKey,
  name: string,
): Promise<string | null> {
  const entry = vault.entries.find((e) => e.key === name);
  if (!entry) return null;

  return decrypt(entry.encryptedValue, key);
}

/**
 * Remove a secret from the vault.
 * Returns the updated vault (also persisted to localStorage).
 */
export async function removeSecret(
  vault: VaultConfig,
  name: string,
): Promise<VaultConfig> {
  vault.entries = vault.entries.filter((e) => e.key !== name);
  saveVault(vault);
  return vault;
}

/**
 * Decrypt every entry in the vault and return a plain key-value map.
 */
export async function getAllSecrets(
  vault: VaultConfig,
  key: CryptoKey,
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  for (const entry of vault.entries) {
    result[entry.key] = await decrypt(entry.encryptedValue, key);
  }

  return result;
}

/**
 * Export all vault secrets as a plain key-value map suitable for
 * injecting into a preview environment as environment variables.
 * Functionally identical to getAllSecrets.
 */
export async function exportToEnvVars(
  vault: VaultConfig,
  key: CryptoKey,
): Promise<Record<string, string>> {
  return getAllSecrets(vault, key);
}
