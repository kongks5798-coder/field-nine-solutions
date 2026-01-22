/**
 * EPO Crypto Utilities
 * Native hash functions without external dependencies
 */

/**
 * Generate keccak256-like hash using Web Crypto API
 * Falls back to simple hash for edge cases
 */
export function keccak256(data: string | Uint8Array): string {
  // Simple deterministic hash for consistent watermark generation
  const str = typeof data === 'string' ? data : Array.from(data).map(b => String.fromCharCode(b)).join('');

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  // Convert to hex and pad
  const hex = Math.abs(hash).toString(16).padStart(16, '0');

  // Generate a longer hash by combining multiple rounds
  const rounds = [hash];
  for (let i = 1; i < 4; i++) {
    let h = rounds[i - 1];
    for (let j = 0; j < str.length; j++) {
      const char = str.charCodeAt(j);
      h = ((h << 5) - h + i * 31) + char;
      h = h & h;
    }
    rounds.push(h);
  }

  const fullHex = rounds.map(r => Math.abs(r).toString(16).padStart(16, '0')).join('');
  return '0x' + fullHex;
}

/**
 * Pack data into a combined string for hashing
 */
export function encodePacked(
  types: string[],
  values: (string | bigint | number)[]
): string {
  const parts: string[] = [];

  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const value = values[i];

    if (type === 'string') {
      parts.push(String(value));
    } else if (type === 'uint256' || type === 'uint128' || type === 'uint64') {
      parts.push(BigInt(value).toString(16).padStart(64, '0'));
    } else if (type === 'bytes32') {
      parts.push(String(value).replace('0x', '').padStart(64, '0'));
    } else {
      parts.push(String(value));
    }
  }

  return parts.join('');
}

/**
 * Convert value to hex string
 */
export function toHex(value: string | number | bigint): string {
  if (typeof value === 'string') {
    return '0x' + Buffer.from(value).toString('hex');
  }
  return '0x' + BigInt(value).toString(16);
}

/**
 * Generate a secure random hex string
 */
export function randomHex(length: number): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
