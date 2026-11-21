import { Raster, rgb } from './raster.ts';
import type { Point, RGB } from './raster.ts';
import { drawText, textWidth } from './bitmap-font.ts';

const palettes = [
  ['A9DDD7', '8ACCC5', '154855', '36968E', 'F8C674'],
  ['F2AF7D', 'ED946B', '492844', 'B65050', 'FFD579'],
  ['96C8E7', '77B7D8', '473B53', 'B9684C', 'F7CF81'],
  ['2A5985', '3C7199', '143455', '83CCED', 'FFDA64'],
  ['1880A6', '3794B3', '103A5B', '71CDCF', 'FFD68A'],
  ['A94A32', 'BD603B', '492B34', 'FFAA5B', 'FFDA73'],
  ['BC664B', 'CA7955', '523448', 'E9AB83', 'FFDA70'],
  ['187556', '258C67', '124438', '95D695', 'FFD780'],
  ['975667', 'AC6C7B', '592D47', 'E8939E', 'FFE0C6'],
  ['584675', '70588B', '31224D', 'BC96E5', 'FFD16C'],
  ['67365E', '854970', '2F294C', 'EB92C1', 'FFBF67'],
  ['3E7958', '51916A', '264C40', '99CD86', 'FFDA79'],
  ['87485A', '9C5B6B', '4F2C47', 'FFA693', 'FFD07C'],
  ['2B775C', '3D8A69', '154C40', 'A5D78C', 'FFDB77'],
  ['98603A', 'B47746', '583940', 'EAB679', 'F9CE85'],
  ['554688', '67569A', '30245F', 'B89BEC', 'F9B98E'],
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
  if (id > 3) rect(0, 53, 192, 3, dark);

  switch (id) {
    case 1: {
      const glass = rgb('CEEFE1');
      rect(0, 42, 192, 14, grid);
      oval(77, 54, 66, 48, dark);
      oval(77, 54, 62, 44, glass);
      for (const end of [27, 49, 77, 105, 127]) arc([77, 11], [end, 16], [end, 52], 1.5, mid);
      arc([21, 38], [77, 20], [133, 38], 1.6, mid);
      arc([34, 25], [77, 12], [120, 25], 1.6, mid);
      rect(10, 51, 134, 5, dark);
      oval(77, 43, 44, 12, dark);
      oval(77, 40, 42, 9, hot);
      oval(77, 40, 30, 4.5, rgb('B77C49'));
      for (const [x, y] of [[41, 32], [57, 28], [77, 27], [98, 28], [114, 32], [48, 47], [67, 51], [89, 51], [107, 47]]) {
        oval(x, y, 3.2, 2.3, dark);
      }
      rect(149, 28, 39, 2, mid);
      oval(165, 26, 17, 21, dark);
      oval(165, 26, 14.6, 18.5, ivory);
      for (const [x, y, a, b] of [[165, 10, 165, 13], [165, 39, 165, 42], [152.5, 26, 154.5, 26], [176, 26, 178, 26]]) {
        line([[x, y], [a, b]], 1.3, mid);
      }
      line([[165, 16], [165, 26], [171.5, 29.5]], 2.4, dark);
      oval(165, 26, 1.8, 2, dark);
      break;
    }
    case 2: {
      oval(134, 33, 36, 24, hot);
      poly([[0, 37], [47, 37], [69, 33], [113, 37], [158, 34], [192, 36], [192, 56], [0, 56]], grid);
      arc([15, 29], [35, -5], [110, 19], 2.8, mid);
      arc([177, 41], [167, -3], [112, 19], 5.4, mid);
      arc([176, 38], [166, -2], [112, 19], 2.3, ivory);
      star(111, 19, 16, mid);
      star(111, 19, 11, ivory);
      for (const [x, y] of [[93, 9], [103, 4], [124, 10], [128, 28], [101, 30]]) oval(x, y, 1.25, 1.7, mid);
      for (const [x, y, w] of [[0, 49, 18], [16, 42, 13], [31, 45, 10], [43, 39, 14], [59, 46, 13], [76, 40, 16], [95, 46, 11], [111, 40, 18], [129, 43, 12], [146, 38, 13], [160, 44, 12], [176, 41, 16]]) {
        rect(x, y, w, 56 - y, dark);
        for (let j = x + 3; j < x + w - 1; j += 4) rect(j, y + 4, 1.5, 2, hot);
      }
      // The inverted arch silhouettes Riyadh's Kingdom Centre.
      poly([[49, 56], [53, 33], [57, 12], [61, 9], [68, 23], [73, 9], [77, 12], [80, 33], [84, 56]], dark);
      line([[58, 12], [75, 12]], 2, dark);
      line([[60, 32], [75, 32]], 1.2, grid);
      poly([[139, 50], [143, 37], [146, 29], [149, 36], [154, 50]], dark);
      oval(146, 32, 2.5, 2.8, hot);
      break;
    }
    case 3: {
      const trace = rgb('B31832');
      oval(145, 20, 25, 19, hot);
      poly([[0, 40], [33, 34], [58, 13], [79, 28], [100, 20], [123, 36], [154, 26], [192, 38], [192, 56], [0, 56]], mid);
      poly([[46, 22], [58, 13], [70, 22], [61, 21], [56, 23], [52, 20]], ivory);
      poly([[0, 45], [39, 39], [66, 41], [95, 35], [101, 41], [92, 45], [112, 56], [0, 56]], dark);
      poly([[109, 39], [129, 44], [155, 39], [192, 43], [192, 56], [122, 56], [105, 46], [114, 44]], rgb('7B4A49'));
      line([[0, 51], [41, 46], [72, 49], [96, 47]], 1.3, hot);
      line([[114, 49], [141, 51], [173, 47], [191, 49]], 1.3, hot);
      const wave: Point[] = [[0, 30], [31, 30], [38, 27], [43, 33], [49, 30], [75, 30], [82, 26], [87, 35],
        [96, 11], [104, 44], [111, 19], [117, 34], [124, 28], [131, 30], [192, 30]];
      line(wave, 4.8, ivory);
      line(wave, 2.35, trace);
      break;
    }
    case 4:
      rect(36, 6, 128, 14, rgb('419DD9'));
      rect(36, 20, 128, 14, hot);
      rect(29, 33, 143, 5, dark);
      for (const x of [33, 68, 103, 138]) {
        arc([x, 52], [x + 15, 23], [x + 30, 52], 5, mid);
        rect(x - 2, 37, 4, 15, mid);
      }
      rect(29, 33, 143, 2, ivory);
      break;
    case 5:
      poly([[0, 8], [51, 13], [62, 22], [41, 27], [0, 27]], mid);
      poly([[192, 6], [166, 16], [170, 29], [192, 35]], mid);
      poly([[31, 31], [160, 31], [169, 28], [161, 42], [147, 47], [46, 47]], dark);
      line([[39, 40], [157, 40]], 2, rgb('F08B62'));
      rect(48, 19, 26, 12, ivory);
      rect(53, 13, 16, 6, ivory);
      rect(50, 21, 21, 2, bg);
      for (let x = 80; x < 145; x += 15) {
        rect(x, 24, 12, 7, hot);
        rect(x + 2, 23, 8, 2, ivory);
      }
      for (let x = 12; x < 180; x += 32) rect(x, 50, 20, 1.5, mid);
      break;
    case 6: {
      const ember = rgb('F27342');
      poly([[30, 52], [34, 16], [44, 16], [48, 52], [54, 52], [58, 9], [69, 9], [74, 52]], dark);
      rect(58, 15, 12, 4, mid);
      poly([[51, 52], [51, 34], [73, 23], [73, 34], [92, 23], [92, 34], [105, 26], [105, 52]], dark);
      rect(61, 39, 32, 3.5, mid);
      line([[88, 48], [110, 48], [110, 35], [158, 35], [158, 49], [172, 49]], 6, dark);
      poly([[117, 43], [110, 33], [120, 17], [125, 24], [134, 5], [143, 21], [150, 14], [158, 29], [151, 43]], ember);
      poly([[122, 41], [118, 33], [129, 29], [134, 14], [146, 31], [149, 35], [143, 44]], hot);
      star(135, 34, 8, ivory);
      break;
    }
    case 7: {
      poly([[19, 55], [65, 40], [128, 40], [175, 55]], dark);
      for (const [x, y, w] of [[91, 42, 9], [88, 46, 15], [84, 51, 24]]) rect(x, y, w, 1.7, mid);
      poly([[31, 28], [59, 25], [52, 9], [63, 9], [85, 24], [108, 23], [119, 14], [132, 14], [127, 24], [156, 25], [169, 28], [158, 34], [55, 34]], ivory);
      rect(143, 28, 13, 2, dark);
      oval(111, 35, 13, 4, dark);
      star(104, 37, 10, rgb('BA2D35'));
      star(104, 37, 6, hot);
      break;
    }
    case 8:
      rect(29, 8, 47, 33, rgb('#BC3B42'));
      star(43, 19, 6, hot);
      rect(119, 8, 47, 33, rgb('#243C73'));
      line([[120, 10], [143, 27]], 2, ivory);
      line([[120, 27], [143, 10]], 2, ivory);
      line([[131, 12], [131, 25]], 2.3, rgb('#c05759'));
      line([[121, 18.5], [142, 18.5]], 2.3, rgb('#c05759'));
      for (const [x, y] of [[138, 32], [148, 21], [150, 29], [154, 25]]) oval(x, y, 1.6, 1.8, ivory);
      line([[53, 47], [77, 47], [86, 36], [105, 36], [116, 47], [141, 47]], 2, hot);
      oval(53, 47, 2.6, 3, hot);
      oval(141, 47, 2.6, 3, hot);
      poly([[84, 34], [83, 22], [92, 12], [111, 6], [110, 21], [100, 34]], mid);
      line([[92, 38], [94, 26], [105, 16]], 2, ivory);
      break;
    case 9:
      rect(30, 9, 73, 37, ivory);
      oval(66, 27.5, 12, 12, rgb('#B53349'));
      poly([[110, 5], [145, 5], [164, 18], [164, 51], [110, 51]], hot);
      poly([[145, 5], [145, 18], [164, 18]], mid);
      for (let y = 22; y < 43; y += 7) rect(119, y, 32 - (y === 36 ? 9 : 0), 2.2, dark);
      break;
    case 10:
      rect(32, 7, 111, 43, dark);
      for (let y = 12; y <= 45; y += 8) rect(35, y, 101, 1, grid);
      line([[37, 13], [54, 13], [68, 25], [82, 20], [100, 35], [118, 33], [131, 45]], 3.6, hot);
      poly([[121, 45], [133, 47], [131, 36]], hot);
      oval(148, 27, 20, 23, hot);
      oval(148, 27, 15.5, 17.5, dark);
      number('B', 148 - textWidth('B', 26) / 2, 14, 26, hot);
      rect(147, 13, 2, 5, hot);
      rect(147, 36, 2, 5, hot);
      break;
    case 11:
      rect(25, 25, 147, 23, dark);
      rect(25, 49, 147, 2, mid);
      rect(45, 6, 48, 14, mid);
      number('F1', 56, 6, 16, dark);
      for (const [x, y, color] of [[32, 23, hot], [96, 34, mid]] as const) {
        rect(x + 5, y + 7, 12, 10, rgb('201A36'));
        rect(x + 49, y + 7, 12, 10, rgb('201A36'));
        poly([[x, y + 9], [x, y + 2], [x + 12, y + 2], [x + 14, y + 6], [x + 28, y + 6],
          [x + 34, y - 2], [x + 44, y - 2], [x + 48, y + 5], [x + 67, y + 6], [x + 66, y + 12]], color);
        rect(x + 32, y + 2, 11, 3, dark);
      }
      star(99, 34, 9, ivory);
      break;
    case 12:
      rect(103, 6, 62, 34, dark);
      rect(103, 40, 62, 2, mid);
      number('136', 113, 10, 22, hot);
      poly([[32, 11], [39, 6], [57, 20], [64, 17], [97, 43], [86, 53], [58, 29], [55, 24]], ivory);
      line([[65, 25], [88, 43]], 2.1, hot);
      oval(105, 45, 7, 7, rgb('B54C48'));
      arc([101, 48], [104, 40], [109, 42], 1.5, ivory);
      break;
    case 13:
      for (let i = 0; i < 9; i++) {
        const x = 31 + i * 16;
        const y = 33 + (i * 7 % 8);
        oval(x, y, 5.1, 5.7, i % 2 === 0 ? hot : mid);
        oval(x, y + 14, 9, 10, dark);
      }
      line([[43, 10], [43, 42]], 2, ivory);
      line([[153, 13], [153, 42]], 2, ivory);
      poly([[43, 6], [153, 9], [153, 26], [43, 23]], hot);
      line([[61, 14], [93, 15]], 2.4, dark);
      line([[103, 15], [136, 16]], 2.4, dark);
      break;
    case 14:
      poly([[26, 19], [43, 7], [148, 7], [166, 19]], mid);
      rect(30, 20, 132, 30, dark);
      for (const x of [39, 52, 137, 150]) rect(x, 22, 6, 23, mid);
      rect(26, 47, 140, 3, hot);
      oval(78, 31, 16, 17, ivory);
      poly([[78, 23], [85, 28], [83, 37], [73, 37], [71, 28]], dark);
      line([[63, 30], [71, 28], [78, 24], [78, 15]], 1.8, dark);
      line([[83, 37], [90, 41]], 1.8, dark);
      number('54', 100, 18, 23, hot);
      break;
    case 15:
      poly([[29, 53], [29, 31], [53, 19], [53, 31], [76, 20], [76, 31], [101, 20], [101, 53]], dark);
      for (let x = 37; x < 94; x += 15) rect(x, 35, 9, 8, hot);
      rect(33, 13, 8, 18, dark);
      rect(33, 13, 8, 3, mid);
      rect(105, 35, 57, 2, mid);
      poly([[92, 25], [113, 22], [107, 9], [116, 9], [134, 21], [147, 20], [154, 14], [162, 14], [160, 20], [171, 22], [175, 25], [166, 29], [107, 29]], ivory);
      break;
    case 16:
      for (const [x, y] of [[36, 13], [59, 45], [96, 19], [108, 10], [165, 8], [181, 31]]) star(x, y, 2.6, ivory);
      oval(133, 29, 27, 25, hot);
      oval(139, 27, 19, 20, mid);
      oval(125, 21, 5, 4, bg);
      oval(146, 34, 5.5, 4, bg);
      oval(126, 42, 3, 2.7, bg);
      orbit(133, 29, 37, 8, -10, ivory);
      line([[36, 39], [94, 13]], 3.4, ivory);
      poly([[31, 36], [53, 26], [58, 34], [36, 44]], mid);
      poly([[77, 15], [95, 7], [101, 15], [82, 24]], mid);
      poly([[53, 24], [69, 16], [80, 27], [63, 35]], hot);
      line([[61, 23], [69, 32]], 1.7, dark);
      break;
  }
  return tile;
}
