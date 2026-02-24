"use client";

/**
 * CSS styles for remote user cursors and selections in Monaco editor.
 * These class names are automatically applied by y-monaco's MonacoBinding
 * when awareness state includes remote cursor positions.
 */
export const AWARENESS_CSS = `
/* Remote user selection highlight */
.yRemoteSelection {
  background-color: var(--yRemoteSelection-color, rgba(250, 129, 0, 0.25));
  border-radius: 1px;
}

/* Remote user cursor (caret line) */
.yRemoteSelectionHead {
  position: absolute;
  border-left: 2px solid var(--yRemoteSelectionHead-color, #f97316);
  border-top: none;
  border-bottom: none;
  box-sizing: border-box;
  height: 100%;
}

/* Remote user name label above cursor */
.yRemoteSelectionHead::after {
  content: attr(data-yjs-user);
  position: absolute;
  top: -1.4em;
  left: -1px;
  padding: 1px 6px;
  border-radius: 4px 4px 4px 0;
  font-size: 10px;
  font-weight: 700;
  font-family: "Pretendard", "Inter", -apple-system, sans-serif;
  line-height: 1.4;
  white-space: nowrap;
  color: #fff;
  background: var(--yRemoteSelectionHead-color, #f97316);
  pointer-events: none;
  user-select: none;
  z-index: 100;
  opacity: 0.9;
  transition: opacity 0.2s;
}

/* Subtle animation when cursor appears */
@keyframes yCursorFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 0.9; transform: translateY(0); }
}
.yRemoteSelectionHead::after {
  animation: yCursorFadeIn 0.2s ease-out;
}
`;

/**
 * Inject awareness cursor CSS into the document head (idempotent).
 * Call this once when collaboration mode activates.
 */
export function injectAwarenessCss(): void {
  const id = "yjs-awareness-css";
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = AWARENESS_CSS;
  document.head.appendChild(style);
}

/**
 * Remove the awareness cursor CSS from the document head.
 * Call this when collaboration mode deactivates.
 */
export function removeAwarenessCss(): void {
  const id = "yjs-awareness-css";
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (el) el.remove();
}
