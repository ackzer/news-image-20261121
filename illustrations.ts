import { Raster, rgb } from './raster.ts';
import type { Point, RGB } from './raster.ts';
import { drawText, textWidth } from './bitmap-font.ts';

const palettes = [
  ['162e3b', '224654', '0f2632', '5faaa4', 'f1be76'],
  ['29263c', '403653', '1c2033', '9b7eac', 'f5b578'],
  ['4a252b', '653c3c', '2e3034', 'b66156', 'f6c992'],
  ['28425f', '365473', '1b314b', '6ca6db', 'f4ce63'],
  ['1b444a', '2b5b60', '173941', '74aba4', 'eec58c'],
  ['4b2a24', '694030', '302631', 'bf7252', 'ffd078'],
  ['314457', '44576b', '1d313d', '8eb4bd', 'ffb86a'],
  ['244437', '37594a', '182f2e', '82a095', 'efbd70'],
  ['4c313e', '694751', '322733', 'c47a76', 'f2ddd4'],
  ['372d48', '514161', '282138', 'a182be', 'fac267'],
  ['352638', '4d344e', '22263d', 'ba6d99', 'f0b962'],
  ['2f483b', '445f4b', '26382e', '83ad75', 'edbe68'],
  ['462935', '634457', '302536', 'ab7989', 'f2c6a0'],
  ['264838', '3a5d47', '19352f', '91b182', 'ebcc7c'],
  ['46382e', '5b4a3d', '312e31', 'b69276', 'efc387'],
  ['282b48', '3d4160', '171d35', '8388b9', 'e7b288'],
];
const ivory = rgb('#f6ebce');

function curve(a: Point, b: Point, c: Point, steps = 24): Point[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const q = 1 - t;
    return [q * q * a[0] + 2 * q * t * b[0] + t * t * c[0], q * q * a[1] + 2 * q * t * b[1] + t * t * c[1]];
  });
}

// Each sketch has its own inks but shares a coarse press-screen underprint.
export function illustrate(id: number, width: number, height: number): Raster {
  const [bg, grid, dark, mid, hot] = palettes[id - 1].map(rgb);
  const tile = new Raster(width, height, bg);
  const sx = width / 192;
  const sy = height / 56;
  const points = (p: readonly Point[]) => p.map(([x, y]): Point => [x * sx, y * sy]);
  const rect = (x: number, y: number, w: number, h: number, c: RGB) => tile.rect(x * sx, y * sy, w * sx, h * sy, c);
  const oval = (x: number, y: number, rx: number, ry: number, c: RGB) => tile.ellipse(x * sx, y * sy, rx * sx, ry * sy, c);
  const poly = (p: readonly Point[], c: RGB) => tile.shape(points(p), c);
  const line = (p: readonly Point[], w: number, c: RGB) => tile.stroke(points(p), Math.max(0.85, sy * w), c);
  const arc = (a: Point, b: Point, c: Point, w: number, ink: RGB) => line(curve(a, b, c), w, ink);
  const orbit = (x: number, y: number, rx: number, ry: number, slant: number, color: RGB) => {
    const path: Point[] = [];
    for (let i = 0; i <= 40; i++) {
      const phase = i * Math.PI / 20;
      path.push([x + rx * Math.cos(phase), y + ry * Math.sin(phase) + slant * Math.cos(phase)]);
    }
    line(path, 1.25, color);
  };
  const number = (value: string, x: number, y: number, size: number, color: RGB) => {
    drawText((l, t, w, h) => rect(l, t, w, h, color), value, x, y, size, { face: 'bold' });
  };
  const star = (x: number, y: number, radius: number, color: RGB) => {
    poly([[x - radius, y], [x - 2, y - 2], [x, y - radius], [x + 2, y - 2], [x + radius, y],
      [x + 2, y + 2], [x, y + radius], [x - 2, y + 2]], color);
  };
  for (let y = 3; y < 56; y += 4) {
    for (let x = (y % 8 === 3 ? 2 : 4); x < 192; x += 5) rect(x, y, 1.15, 1.5, grid);
  }
  rect(0, 50, 192, 6, dark);

  switch (id) {
    case 1: {
      oval(112, 53, 63, 42, mid);
      oval(112, 53, 58, 37, bg);
      for (const end of [66, 87, 111, 135, 157]) arc([112, 15], [end, 20], [end, 50], 1.15, mid);
      arc([58, 39], [112, 21], [166, 39], 1.1, mid);
      arc([65, 29], [112, 15], [157, 29], 1.1, mid);
      rect(0, 50, 192, 6, dark);
      oval(112, 45, 39, 10, dark);
      oval(112, 42, 39, 9, hot);
      oval(112, 41, 29, 5, bg);
      for (const [x, y] of [[73, 33], [86, 27], [103, 25], [121, 25], [138, 28], [151, 34], [82, 48], [99, 51], [125, 51], [143, 48]]) {
        oval(x, y, 3.3, 2.4, ivory);
      }
      line([[108, 36], [111, 41], [109, 43], [116, 47]], 1.5, dark);
      break;
    }
    case 2: {
      oval(124, 68, 53, 35, mid);
      oval(124, 69, 50, 34, bg);
      arc([34, 38], [56, -10], [116, 22], 2, mid);
      arc([175, 29], [152, -4], [119, 22], 2, ivory);
      arc([48, 49], [80, -4], [112, 19], 1.25, mid);
      star(116, 22, 13, hot);
      star(116, 22, 6, ivory);
      for (const [x, y, w] of [[3, 45, 12], [17, 40, 10], [29, 46, 8], [39, 41, 12], [55, 44, 12], [69, 49, 6], [78, 42, 12], [93, 39, 11], [107, 46, 8], [118, 40, 12], [133, 46, 8], [144, 38, 12], [159, 44, 11], [173, 39, 12], [187, 43, 8]]) {
        rect(x, y, w, 56 - y, dark);
        if (w > 8) rect(x + 3, y + 3, 2, 2, hot);
      }
      break;
    }
    case 3: {
      oval(150, 21, 23, 19, hot);
      poly([[0, 48], [31, 28], [46, 36], [76, 9], [101, 33], [129, 14], [163, 36], [177, 26], [192, 38], [192, 56], [0, 56]], mid);
      poly([[0, 50], [47, 39], [63, 43], [86, 30], [113, 39], [136, 30], [167, 42], [192, 35], [192, 56], [0, 56]], dark);
      poly([[59, 24], [76, 9], [92, 25], [81, 21], [76, 25], [70, 21]], ivory);
      line([[84, 27], [91, 34], [88, 38], [102, 47], [97, 56]], 2, hot);
      line([[0, 47], [31, 47], [38, 44], [43, 47], [50, 47], [54, 43], [61, 52], [66, 45], [70, 47], [192, 47]], 1.2, ivory);
      break;
    }
    case 4:
      rect(31, 8, 142, 13, mid);
      rect(31, 21, 142, 13, hot);
      line([[25, 36], [183, 36]], 4, dark);
      for (const x of [44, 81, 118, 155]) {
        arc([x, 49], [x + 15, 31], [x + 30, 49], 3.5, mid);
        rect(x - 1, 37, 3, 12, mid);
      }
      line([[25, 36], [183, 36]], 1.5, ivory);
      break;
    case 5:
      poly([[0, 14], [52, 17], [66, 25], [41, 30], [0, 32]], mid);
      poly([[192, 11], [163, 20], [167, 31], [192, 37]], mid);
      poly([[42, 34], [158, 34], [149, 46], [55, 46]], dark);
      rect(55, 23, 21, 11, ivory);
      rect(60, 18, 13, 5, ivory);
      rect(90, 28, 49, 6, hot);
      for (let x = 96; x < 139; x += 12) rect(x, 29, 2, 4, bg);
      for (let x = 12; x < 180; x += 32) line([[x, 48], [x + 20, 48]], 1.2, mid);
      break;
    case 6:
      poly([[19, 50], [23, 18], [31, 18], [34, 50], [40, 50], [43, 12], [50, 12], [54, 50]], dark);
      poly([[42, 50], [42, 35], [58, 25], [58, 35], [77, 25], [77, 34], [91, 27], [91, 50]], dark);
      line([[61, 47], [103, 47], [103, 36], [161, 36], [161, 49], [181, 49]], 5, mid);
      poly([[121, 42], [116, 33], [124, 22], [129, 26], [136, 7], [145, 22], [150, 16], [156, 31], [149, 42]], hot);
      star(139, 34, 7, ivory);
      break;
    case 7:
      poly([[17, 53], [59, 39], [132, 39], [183, 53]], dark);
      for (const [x, y, w] of [[69, 42, 9], [83, 46, 14], [101, 51, 21]]) rect(x, y, w, 1.5, mid);
      poly([[47, 29], [75, 26], [64, 12], [74, 12], [94, 24], [109, 24], [118, 17], [131, 17], [126, 24], [153, 25], [163, 28], [151, 32], [68, 33]], ivory);
      oval(111, 34, 9, 2.8, mid);
      star(103, 35, 9, hot);
      break;
    case 8:
      rect(33, 11, 39, 28, rgb('#a32f39'));
      star(43, 19, 5, hot);
      rect(120, 11, 39, 28, rgb('#28365e'));
      line([[121, 12], [142, 25]], 2, ivory);
      line([[121, 25], [142, 12]], 2, ivory);
      line([[131, 12], [131, 25]], 2.3, rgb('#c05759'));
      line([[121, 18.5], [142, 18.5]], 2.3, rgb('#c05759'));
      for (const [x, y] of [[138, 32], [148, 21], [150, 29], [154, 25]]) oval(x, y, 1.6, 1.8, ivory);
      line([[62, 45], [79, 45], [87, 35], [102, 35], [113, 45], [134, 45]], 1.6, hot);
      poly([[87, 32], [86, 23], [93, 15], [108, 9], [107, 22], [99, 32]], mid);
      line([[95, 36], [95, 27], [102, 18]], 1.5, ivory);
      break;
    case 9:
      rect(39, 10, 64, 32, ivory);
      oval(71, 26, 10, 10, rgb('#a33b4b'));
      poly([[115, 7], [141, 7], [156, 17], [156, 49], [115, 49]], hot);
      poly([[141, 7], [141, 17], [156, 17]], mid);
      for (let y = 22; y < 42; y += 7) rect(123, y, 23 - (y === 36 ? 7 : 0), 1.5, dark);
      break;
    case 10:
      for (let y = 13; y <= 45; y += 8) line([[30, y], [137, y]], 1, grid);
      line([[37, 13], [54, 13], [68, 25], [82, 20], [100, 35], [118, 33], [134, 48]], 3, hot);
      poly([[123, 46], [134, 48], [132, 37]], hot);
      oval(153, 24, 19, 18, hot);
      oval(153, 24, 14, 13, dark);
      number('B', 153 - textWidth('B', 18) / 2, 15, 18, hot);
      break;
    case 11:
      line([[23, 49], [174, 49]], 1.4, mid);
      rect(42, 8, 37, 11, mid);
      number('F1', 51, 8, 12, ivory);
      for (const [x, y, color] of [[36, 23, hot], [87, 36, mid]] as const) {
        rect(x + 5, y + 7, 12, 8, dark);
        rect(x + 49, y + 7, 12, 8, dark);
        poly([[x, y + 9], [x, y + 2], [x + 12, y + 2], [x + 14, y + 6], [x + 28, y + 6],
          [x + 34, y], [x + 44, y], [x + 48, y + 5], [x + 67, y + 6], [x + 66, y + 10]], color);
        rect(x + 32, y + 2, 11, 3, dark);
      }
      star(98, 36, 7, ivory);
      break;
    case 12:
      rect(105, 8, 47, 31, dark);
      number('136', 115, 14, 15, hot);
      poly([[49, 13], [53, 10], [66, 23], [72, 22], [91, 44], [85, 50], [65, 30], [64, 26]], ivory);
      line([[78, 32], [88, 43]], 1.2, mid);
      oval(100, 43, 5, 5.5, hot);
      arc([97, 44], [99, 40], [103, 41], 1, dark);
      break;
    case 13:
      for (let i = 0; i < 12; i++) {
        const x = 27 + i * 13;
        const y = 36 + (i * 7 % 9);
        oval(x, y, 4.2, 4.5, i % 2 === 0 ? hot : mid);
        oval(x, y + 12, 7.5, 8.5, dark);
      }
      line([[58, 13], [58, 40]], 2, ivory);
      line([[136, 15], [136, 40]], 2, ivory);
      poly([[58, 10], [135, 12], [135, 24], [58, 22]], hot);
      for (let x = 70; x < 125; x += 14) line([[x, 16], [x + 9, 16]], 1.5, bg);
      break;
    case 14:
      poly([[21, 21], [39, 11], [151, 11], [172, 21]], mid);
      rect(29, 22, 135, 27, dark);
      for (let x = 37; x < 163; x += 15) rect(x, 25, 7, 19, mid);
      rect(22, 46, 148, 3, hot);
      oval(77, 31, 15, 13, ivory);
      poly([[77, 24], [83, 28], [81, 35], [73, 35], [71, 28]], dark);
      line([[63, 30], [72, 28], [77, 25], [77, 18]], 1.4, dark);
      line([[81, 35], [88, 39]], 1.4, dark);
      number('54', 105, 20, 20, hot);
      break;
    case 15:
      poly([[23, 51], [23, 36], [46, 24], [46, 36], [72, 24], [72, 36], [96, 25], [96, 51]], dark);
      for (let x = 31; x < 91; x += 15) rect(x, 40, 7, 5, hot);
      rect(27, 17, 7, 17, mid);
      line([[103, 17], [151, 17]], 1, mid);
      line([[112, 37], [172, 37]], 1, mid);
      poly([[102, 27], [119, 24], [113, 12], [120, 12], [139, 23], [151, 22], [157, 17], [164, 17], [162, 22], [177, 24], [181, 27], [170, 29], [115, 30]], ivory);
      break;
    case 16:
      for (const [x, y] of [[36, 13], [59, 41], [96, 17], [111, 11], [160, 8], [181, 31]]) star(x, y, 2.5, ivory);
      oval(141, 31, 23, 20, hot);
      oval(147, 29, 16, 17, mid);
      oval(134, 25, 4.5, 3, bg);
      oval(151, 37, 5, 3, bg);
      orbit(141, 31, 43, 7, -11, ivory);
      line([[47, 35], [91, 16]], 2.5, ivory);
      poly([[42, 32], [58, 25], [61, 31], [45, 38]], mid);
      poly([[79, 16], [92, 10], [95, 16], [81, 22]], mid);
      poly([[58, 23], [72, 17], [81, 27], [66, 33]], hot);
      break;
  }
  return tile;
}
