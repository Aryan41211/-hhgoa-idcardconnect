// Render a region as ASCII art by classifying pixels into buckets, so text
// structure can be "read" without seeing the image.
const { decodePNG } = require("./pngDecode.js");

const [file, x0, y0, x1, y1, cols, rows] = process.argv.slice(2);
const { width, height, data } = decodePNG(file);
const x0n = Number(x0), y0n = Number(y0), x1n = Number(x1), y1n = Number(y1);
const cn = Number(cols || 80), rn = Number(rows || 20);

function bucket(i) {
  const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
  if (a < 20) return " ";
  if (r > 200 && g < 150 && b < 160) return "P"; // pink
  if (r > 220 && g > 180 && b < 140) return "Y"; // gold
  if (r < 120 && g < 120 && b < 120) return "#"; // near black
  if (g > r + 20 && g > b + 20) return "G"; // green
  if (r > 200 && g > 200 && b > 160) return "."; // cream / light
  if (r > 200 && g > 200 && b > 200) return ","; // white
  if (r < 130 && g < 130 && b < 130) return "x"; // dark gray
  return "o"; // other
}

console.log("REGION", file, x0n, y0n, "->", x1n, y1n, "sample", Math.round((x1n - x0n) / cn) + "px/c");
for (let r = 0; r < rn; r++) {
  let line = "";
  for (let c = 0; c < cn; c++) {
    const x = Math.min(x1n - 1, x0n + Math.floor(((c + 0.5) / cn) * (x1n - x0n)));
    const y = Math.min(y1n - 1, y0n + Math.floor(((r + 0.5) / rn) * (y1n - y0n)));
    line += bucket((y * width + x) * 4);
  }
  console.log(line);
}
