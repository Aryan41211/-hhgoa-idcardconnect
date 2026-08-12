// Minimal dependency-free PNG decoder (zlib is built into Node).
const zlib = require("zlib");

function decodePNG(file) {
  const fs = require("fs");
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

module.exports = { decodePNG };