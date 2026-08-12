// Print a horizontal binary profile of gradient pixels along a row, so slot
// boundaries can be read unambiguously (1 = gradient, . = not).
const { decodePNG } = require("./pngDecode.js");

const [file, yLine, x0, x1] = process.argv.slice(2);
const { width, height, data } = decodePNG(file);
const y = Number(yLine);
const a = Number(x0 || 0), b = Number(x1 || width - 1);

function isGrad(r, g, bl) {
  const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl);
  const sat = mx - mn;
  const pinkish = r > 130 && r > g + 30 && r > bl + 30 && g < 200;
  const tealish = bl > 120 && g > 110 && g >= r + 20 && bl >= r + 10 && mx < 230;
  return (pinkish || tealish) && sat > 45 && mx > 105;
}

let line = "";
let runs = [];
let cur = 0, prev = 0;
for (let x = a; x <= b; x++) {
  const i = (y * width + x) * 4;
  const on = isGrad(data[i], data[i + 1], data[i + 2]) ? 1 : 0;
  line += on ? "#" : ".";
  if (on !== prev) {
    if (prev) runs.push(cur);
    else runs.push(cur);
    prev = on;
  }
  cur = x;
}
runs.push(cur);
console.log("y=" + y, "x " + a + "-" + b);
console.log(line);
// print runs
const rr = [];
let start = a;
for (let i = 0; i <= b - a; i++) {
  const on = line[i] === "#";
  const nextOn = i < b - a ? line[i + 1] === "#" : false;
  if (on && !nextOn) rr.push([start, a + i]);
  if (!on && nextOn) start = a + i + 1;
}
console.log("gradient runs:", JSON.stringify(rr));