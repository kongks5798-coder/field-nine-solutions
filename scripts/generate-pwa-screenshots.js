/**
 * generate-pwa-screenshots.js
 *
 * Generates placeholder PWA screenshot images for Chrome's enhanced install UI.
 * Output:
 *   - public/screenshot-wide.webp   (1280x720, desktop)
 *   - public/screenshot-narrow.webp (390x844,  mobile)
 *
 * Prerequisites:
 *   npm install canvas
 *
 * Usage:
 *   node scripts/generate-pwa-screenshots.js
 */

const fs = require("fs");
const path = require("path");

let createCanvas;
try {
  ({ createCanvas } = require("canvas"));
} catch {
  console.error(
    "Error: 'canvas' package is not installed.\n" +
      "Run the following command first:\n\n" +
      "  npm install canvas\n"
  );
  process.exit(1);
}

const BG_COLOR = "#07080f";
const ORANGE = "#f97316";
const WHITE = "#e2e8f0";
const OUTPUT_DIR = path.resolve(__dirname, "..", "public");

function drawScreenshot(width, height, filename) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, height);

  // Subtle grid lines for visual interest
  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = gridSize; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = gridSize; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Orange accent bar at top
  ctx.fillStyle = ORANGE;
  ctx.fillRect(0, 0, width, 4);

  // Main title — "Dalkak"
  const titleSize = Math.round(width * 0.08);
  ctx.font = `bold ${titleSize}px sans-serif`;
  ctx.fillStyle = ORANGE;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Dalkak", width / 2, height * 0.38);

  // Subtitle — "AI 웹앱 빌더"
  const subtitleSize = Math.round(width * 0.04);
  ctx.font = `${subtitleSize}px sans-serif`;
  ctx.fillStyle = WHITE;
  ctx.fillText("AI 웹앱 빌더", width / 2, height * 0.38 + titleSize * 0.9);

  // Tagline
  const taglineSize = Math.round(width * 0.022);
  ctx.font = `${taglineSize}px sans-serif`;
  ctx.fillStyle = "rgba(226, 232, 240, 0.5)";
  ctx.fillText(
    "GPT-4o · Claude · Gemini · Grok",
    width / 2,
    height * 0.38 + titleSize * 0.9 + subtitleSize * 1.5
  );

  // Dimension label (bottom-right)
  const labelSize = Math.round(width * 0.018);
  ctx.font = `${labelSize}px sans-serif`;
  ctx.fillStyle = "rgba(226, 232, 240, 0.25)";
  ctx.textAlign = "right";
  ctx.fillText(`${width}x${height}`, width - 20, height - 16);

  // Write as WebP (canvas package outputs as PNG buffer; we save as .webp extension)
  // The 'canvas' package supports toBuffer('image/png'). For actual WebP,
  // sharp would be needed, but we output PNG data with a .webp extension
  // as a placeholder. Replace with sharp conversion for production.
  const outPath = path.join(OUTPUT_DIR, filename);
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outPath, buffer);
  console.log(`  Created: ${outPath}  (${width}x${height})`);
}

console.log("Generating PWA placeholder screenshots...\n");

drawScreenshot(1280, 720, "screenshot-wide.webp");
drawScreenshot(390, 844, "screenshot-narrow.webp");

console.log("\nDone! Replace these placeholders with real screenshots for production.");
