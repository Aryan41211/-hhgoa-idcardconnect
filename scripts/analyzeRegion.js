// Finer sub-region analysis: dump a high-res color grid for a rect so we can
// see text/structure inside the cream block, photo slot, stamp, etc.
const { decodePNG } = require("./pngDecode.js");

const [file, x0, y0, x1, y1, cols, rows] = process.argv.slice(2);
const { width, height, data } = decodePNG(file);
const x0n = Number(x0), y0n = Number(y0), x1n = Number(x1), y1n = Number(y1);
const cn = Number(cols || 40), rn = Number(rows || 12);

const hex = (i) =>
  "#" + [data[i], data[i + 1], data[i + 2]].map((v) => v.toString(16).padStart(2, "0")).join("");

console.log("REGION", file, x0n, y0n, "->", x1n, y1n, "size", x1n - x0n, "x", y1n - y0n);
for (let r = 0; r < rn; r++) {
  const line = [];
  for (let c = 0; c < cn; c++) {
    const x = Math.min(x1n - 1, x0n + Math.floor(((c + 0.5) / cn) * (x1n - x0n)));
    const y = Math.min(y1n - 1, y0n + Math.floor(((r + 0.5) / rn) * (y1n - y0n)));
    const di = (y * width + x) * 4;
    line.push(hex(di));
  }
  console.log(line.join(" "));
}
