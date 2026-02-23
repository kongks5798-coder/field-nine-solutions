/**
 * Haptic feedback utility for mobile devices.
 * Falls back silently on desktop or unsupported devices.
 */

export function hapticLight() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(10);
  }
}

export function hapticMedium() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(25);
  }
}

export function hapticHeavy() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([30, 10, 30]);
  }
}
