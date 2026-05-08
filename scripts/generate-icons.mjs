import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "..", "public");

function makeSVG(size) {
  const radius = Math.round(size * 0.14);
  const fontSize = Math.round(size * 0.44);
  const barHeight = Math.max(2, Math.round(size * 0.09));
  const barY = size - barHeight;
  const textY = Math.round((size - barHeight) / 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs>
    <clipPath id="r">
      <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}"/>
    </clipPath>
  </defs>
  <g clip-path="url(#r)">
    <rect width="${size}" height="${size}" fill="#0B0F1C"/>
    <rect x="0" y="${barY}" width="${size}" height="${barHeight}" fill="#C94A00"/>
    <text
      x="${size / 2}"
      y="${textY}"
      text-anchor="middle"
      dominant-baseline="central"
      font-family="Georgia, 'Times New Roman', serif"
      font-size="${fontSize}"
      font-weight="bold"
      fill="#E8B84B"
    >CW</text>
  </g>
</svg>`;
}

function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  let offset = 6 + 16 * count;
  const entries = pngBuffers.map((png) => {
    const w = png.readUInt32BE(16);
    const h = png.readUInt32BE(20);
    const entry = Buffer.alloc(16);
    entry.writeUInt8(w >= 256 ? 0 : w, 0);
    entry.writeUInt8(h >= 256 ? 0 : h, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

async function main() {
  const sizes = [16, 32, 180, 192, 512];
  const bufs = {};

  for (const size of sizes) {
    const svg = makeSVG(size);
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();
    bufs[size] = buf;
    writeFileSync(join(PUBLIC, `icon-${size}.png`), buf);
    console.log(`icon-${size}.png`);
  }

  const ico = buildIco([bufs[16], bufs[32]]);
  writeFileSync(join(PUBLIC, "favicon.ico"), ico);
  console.log("favicon.ico");
}

main().catch((err) => { console.error(err); process.exit(1); });
