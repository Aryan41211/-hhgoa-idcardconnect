// Find the top-N gradient connected components (photo placeholder slots).
const { decodePNG } = require("./pngDecode.js");

function isGrad(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const sat = mx - mn;
  const pinkish = r > 130 && r > g + 30 && r > b + 30 && g < 200;
  const tealish = b > 120 && g > 110 && g >= r + 20 && b >= r + 10 && mx < 230;
  return (pinkish || tealish) && sat > 45 && mx > 105;
}

function topComponents(file, n) {
  const { width, height, data } = decodePNG(file);
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    mask[i] = isGrad(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]) ? 1 : 0;
  }
  const seen = new Uint8Array(width * height);
  const comps = [];
  const stack = [];
  for (let start = 0; start < width * height; start++) {
    if (!mask[start] || seen[start]) continue;
    stack.length = 0;
    stack.push(start);
    seen[start] = 1;
    let area = 0, minX = Infinity, minY = Infinity, maxX = -1, maxY = -1;
    while (stack.length) {
      const idx = stack.pop();
      const x = idx % width, y = (idx / width) | 0;
      area++;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const ni = ny * width + nx;
          if (mask[ni] && !seen[ni]) {
            seen[ni] = 1;
            stack.push(ni);
          }
        }
      }
    }
    comps.push({ area, x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
  }
  comps.sort((a, b) => b.area - a.area);
  console.log(file, "dim", width + "x" + height, "top", n, "components:");
  comps.slice(0, n).forEach((c) =>
    console.log("  ", JSON.stringify({ x: c.x, y: c.y, w: c.w, h: c.h }), "area:", c.area)
  );
}

process.argv.slice(2).forEach((f) => topComponents(f, 8));