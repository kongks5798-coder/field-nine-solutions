// ── Vision Guard ────────────────────────────────────────────────────────────
// Utility functions that check whether a model supports vision input and
// validate image attachments before they are sent to the AI provider.

import { getModelMeta } from "./modelRegistry";

/** Maximum allowed image size in bytes (5 MB). */
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/** Allowed image MIME types. */
const ALLOWED_IMAGE_TYPES: ReadonlySet<string> = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

/**
 * Returns `true` when the model identified by `modelId` supports vision
 * (image) inputs.  Falls back to `false` for unknown model IDs.
 */
export function canModelHandleVision(modelId: string): boolean {
  const meta = getModelMeta(modelId);
  return meta?.supportsVision ?? false;
}

/**
 * Validate an image `File` before attaching it to an AI request.
 *
 * Checks:
 * - File size <= 5 MB
 * - MIME type is one of png, jpeg, gif, webp
 *
 * Returns `{ valid: true }` on success, or `{ valid: false, error: "..." }`
 * with a human-readable Korean error message on failure.
 */
export function validateImageAttachment(
  file: File,
): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    const allowed = Array.from(ALLOWED_IMAGE_TYPES)
      .map((t) => t.replace("image/", ""))
      .join(", ");
    return {
      valid: false,
      error: `지원하지 않는 이미지 형식입니다. 허용 형식: ${allowed}`,
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `이미지 크기가 너무 큽니다 (${sizeMb} MB). 최대 5 MB까지 허용됩니다.`,
    };
  }

  return { valid: true };
}
