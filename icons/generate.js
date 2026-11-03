#!/usr/bin/env node
// Generates icon-192.png and icon-512.png using only built-in Node.js APIs.
// Uses a minimal pure-JS PNG encoder (no npm packages needed).

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createIcon(size) {
  const width = size;
  const height = size;
  const pixels = new Uint8Array(width * height * 4);

  const cx = width / 2;
  const cy = height / 2;
  const r = width / 2;

  // Background gradient: #ff8c42 → #ffab76
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;

      // Circular mask (rounded square via squircle approximation)
      const rx = width * 0.22; // border-radius as fraction
      const inCircle = Math.pow(Math.abs(dx) / (r - rx), 4) + Math.pow(Math.abs(dy) / (r - rx), 4) < 1;

      if (!inCircle) {
        pixels[idx + 3] = 0; // transparent
        continue;
      }

      // Gradient: top-left orange → bottom-right light orange
      const t = (x + y) / (width + height);
      pixels[idx]     = Math.round(0xff * (1 - t) + 0xff * t); // R: 255→255
      pixels[idx + 1] = Math.round(0x8c * (1 - t) + 0xab * t); // G: 140→171
      pixels[idx + 2] = Math.round(0x42 * (1 - t) + 0x76 * t); // B: 66→118
      pixels[idx + 3] = 255;
    }
  }

  // Draw "📐" as "Ax" text approximation using pixel art
  // Instead, draw a white "A" glyph (simple triangle) + ruler lines
  drawSymbol(pixels, width, height);

  return encodePNG(pixels, width, height);
}

function drawSymbol(pixels, width, height) {
  const scale = width / 192;
  const white = [255, 255, 255, 240];

  // Draw a simple triangle (A-like shape) centered
  const centerX = width * 0.5;
  const centerY = height * 0.52;
  const triSize = width * 0.38;

  // Filled equilateral triangle pointing up
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;

      // Triangle: top vertex at (0, -triSize*0.6), base at ±triSize*0.5, triSize*0.4
      const normDy = dy / triSize;
      const normDx = dx / triSize;

      // Check if inside triangle
      const topY = -0.58;
      const botY = 0.42;
      const halfBase = 0.5;

      if (normDy >= topY && normDy <= botY) {
        const progress = (normDy - topY) / (botY - topY);
        const halfWidth = progress * halfBase;
        if (Math.abs(normDx) <= halfWidth) {
          const idx = (y * width + x) * 4;
          pixels[idx]     = white[0];
          pixels[idx + 1] = white[1];
          pixels[idx + 2] = white[2];
          pixels[idx + 3] = white[3];
        }
      }
    }
  }

  // Draw crossbar of "A" (horizontal line inside triangle)
  const barY = Math.round(centerY + triSize * 0.1);
  const barHalf = Math.round(triSize * 0.22);
  const lineThick = Math.max(2, Math.round(width * 0.04));

  for (let dy2 = -lineThick; dy2 <= lineThick; dy2++) {
    for (let dx2 = -barHalf; dx2 <= barHalf; dx2++) {
      const x = Math.round(centerX + dx2);
      const y = barY + dy2;
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        // Cut through the white: make it the gradient color back (hollow bar)
        const t = (x + y) / (width + height);
        pixels[idx]     = Math.round(0xff * (1 - t) + 0xff * t);
        pixels[idx + 1] = Math.round(0x8c * (1 - t) + 0xab * t);
        pixels[idx + 2] = Math.round(0x42 * (1 - t) + 0x76 * t);
        pixels[idx + 3] = 255;
      }
    }
  }
}

// ─── Minimal PNG Encoder ──────────────────────────────────────────────────
function encodePNG(pixels, width, height) {
  // Build raw image data (filter byte 0 per row)
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // filter type: None
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      row[1 + x * 4]     = pixels[src];
      row[1 + x * 4 + 1] = pixels[src + 1];
      row[1 + x * 4 + 2] = pixels[src + 2];
      row[1 + x * 4 + 3] = pixels[src + 3];
    }
    rawRows.push(row);
  }
  const raw = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(raw, { level: 6 });

  function uint32BE(n) {
    const b = Buffer.alloc(4);
    b.writeUInt32BE(n, 0);
    return b;
  }

  function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const lenBuf = uint32BE(data.length);
    const crcBuf = crc32(Buffer.concat([typeBytes, data]));
    return Buffer.concat([lenBuf, typeBytes, data, uint32BE(crcBuf)]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function crc32(buf) {
  const table = makeCRCTable();
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

let _crcTable = null;
function makeCRCTable() {
  if (_crcTable) return _crcTable;
  _crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    _crcTable[n] = c;
  }
  return _crcTable;
}

// ─── Main ─────────────────────────────────────────────────────────────────
const outDir = path.join(__dirname, 'icons');
fs.mkdirSync(outDir, { recursive: true });

for (const size of [192, 512]) {
  const png = createIcon(size);
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png);
  console.log(`✅ icon-${size}.png (${png.length} bytes)`);
}

