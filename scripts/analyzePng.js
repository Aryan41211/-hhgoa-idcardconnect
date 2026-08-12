// Decode a PNG (no deps, zlib built-in) and report layout facts the canvas
// compositor needs: dimensions, photo-slot bbox (transparent window or the
// pink->teal placeholder area), blank text zones, dominant colors.
const fs = require("fs");
const zlib = require("zlib");

function decodePNG(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(file + " is not a PNG");
  let offset = 8;
  let width = 0, height = 0, bitDepth = 8, colorType = 6, interlace = 0;
  const idat = [];
  let palette = null;
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "PLTE") {
      palette = data;
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") break;
    offset += 12 + len;
  }
  if (interlace) throw new Error("interlaced PNG not supported");
  const raw = zlib.inflateSync(Buffer.concat(idat));

  const chan = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  const bpp = Math.max(1, chan * (bitDepth / 8));
  const stride = width * bpp;
  const out = Buffer.alloc(width * height * 4);

  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };

  let pos = 0;
  const prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const f = raw[pos++];
    const row = raw.subarray(pos, pos + stride);
    pos += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? row[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = row[x];
      if (f === 1) v = (v + a) & 255;
      else if (f === 2) v = (v + b) & 255;
      else if (f === 3) v = (v + ((a + b) >> 1)) & 255;
      else if (f === 4) v = (v + paeth(a, b, c)) & 255;
      row[x] = v;
    }
    // write pixel row
    for (let x = 0; x < width; x++) {
      const si = x * bpp;
      const di = (y * width + x) * 4;
      if (colorType === 6) {
        out[di] = row[si]; out[di + 1] = row[si + 1]; out[di + 2] = row[si + 2]; out[di + 3] = row[si + 3];
      } else if (colorType === 2) {
        out[di] = row[si]; out[di + 1] = row[si + 1]; out[di + 2] = row[si + 2]; out[di + 3] = 255;
      } else if (colorType === 0) {
        out[di] = row[si]; out[di + 1] = row[si]; out[di + 2] = row[si]; out[di + 3] = 255;
      } else if (colorType === 4) {
        out[di] = row[si]; out[di + 1] = row[si]; out[di + 2] = row[si]; out[di + 3] = row[si + 1];
      } else if (colorType === 3) {
        const pi = row[si] * 3;
        out[di] = palette[pi]; out[di + 1] = palette[pi + 1]; out[di + 2] = palette[pi + 2]; out[di + 3] = 255;
      }
    }
    prev.set(row);
  }
  return { width, height, data: out };
}

function hex(c) {
  return "#" + [c[0], c[1], c[2]].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function analyze(file) {
  const { width, height, data } = decodePNG(file);
  console.log("FILE:", file);
  console.log("DIMENSIONS:", width, "x", height, "aspect", (width / height).toFixed(4));

  // alpha bbox (transparent cutout)
  let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1, alphaPx = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3];
      if (a < 10) {
        alphaPx++;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  if (alphaPx > 0) {
    console.log("TRANSPARENT window bbox:", { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 });
  } else {
    console.log("NO transparency in image");
  }

  // color map grid 20x20
  const gx = 20, gy = 20;
  const grid = [];
  for (let gyi = 0; gyi < gy; gyi++) {
    const row = [];
    for (let gxi = 0; gxi < gx; gxi++) {
      const x = Math.min(width - 1, Math.floor(((gxi + 0.5) / gx) * width));
      const y = Math.min(height - 1, Math.floor(((gyi + 0.5) / gy) * height));
      const di = (y * width + x) * 4;
      row.push(hex([data[di], data[di + 1], data[di + 2]]));
    }
    grid.push(row);
  }
  console.log("COLOR MAP (" + gx + "x" + gy + "):");
  console.log(grid.map((r) => r.join(" ")).join("\n"));

  // dominant colors (quantized to 32)
  const counts = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 10) continue;
    const key = [data[i] >> 5, data[i + 1] >> 5, data[i + 2] >> 5].join(",");
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const total = width * height;
  console.log("TOP COLORS:", top.map(([k, n]) => {
    const [r, g, b] = k.split(",").map((v) => (v * 32 + 16));
    return hex([r, g, b]) + " " + ((n / total) * 100).toFixed(1) + "%";
  }).join("  "));
  console.log("---");
}

for (const f of process.argv.slice(2)) {
  analyze(f);
}
