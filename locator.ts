import { drawText, textWidth } from './bitmap-font.ts';
import { Raster, rgb } from './raster.ts';
import type { Point, RGB } from './raster.ts';

const sea = rgb('#E9E8DD');
const grid = rgb('#D9DACD');
const land = rgb('#C9C8AE');
const edge = rgb('#A7A78F');
const ink = rgb('#343B3B');
const cream = rgb('#F6F3EC');
const titleFace = { face: 'bold' } as const;

// Hand-plotted coastlines in longitude/latitude, deliberately generalized.
const shores: readonly (readonly Point[])[] = [
  [[-168, 65], [-160, 71], [-137, 70], [-128, 73], [-110, 69], [-97, 71], [-84, 65], [-80, 59], [-88, 56], [-81, 52], [-74, 54], [-66, 57], [-56, 52], [-57, 46], [-66, 46], [-73, 41], [-78, 34], [-81, 25], [-85, 29], [-91, 29], [-96, 25], [-97, 19], [-92, 17], [-86, 21], [-85, 15], [-82, 9], [-77, 8], [-79, 6], [-85, 9], [-90, 14], [-100, 17], [-110, 23], [-115, 31], [-124, 41], [-125, 49], [-132, 55], [-145, 60], [-153, 57], [-166, 54], [-161, 59]],
  [[-74, 77], [-59, 83], [-25, 83], [-20, 76], [-26, 68], [-42, 59], [-50, 63], [-57, 72]],
  [[-79, 9], [-73, 12], [-62, 10], [-55, 5], [-51, 1], [-41, -1], [-35, -6], [-40, -15], [-45, -23], [-51, -30], [-57, -39], [-64, -52], [-70, -54], [-74, -46], [-73, -34], [-70, -23], [-75, -13], [-81, -5], [-79, 2]],
  [[-17, 33], [-10, 36], [2, 37], [15, 33], [25, 32], [32, 31], [35, 22], [42, 13], [51, 10], [44, 1], [40, -10], [35, -20], [32, -27], [22, -35], [16, -33], [12, -24], [12, -15], [8, -5], [9, 4], [2, 5], [-6, 4], [-13, 8], [-17, 15]],
  [[-10, 36], [-10, 43], [-5, 46], [1, 51], [9, 55], [5, 60], [13, 67], [22, 71], [32, 70], [34, 63], [28, 59], [39, 64], [51, 67], [57, 72], [77, 72], [84, 76], [104, 77], [113, 73], [128, 73], [142, 71], [154, 74], [174, 68], [179, 64], [167, 62], [161, 55], [157, 51], [153, 54], [151, 60], [140, 55], [136, 49], [130, 43], [129, 37], [125, 38], [123, 31], [119, 25], [112, 21], [108, 20], [109, 14], [105, 8], [101, 5], [105, 2], [102, 1], [98, 7], [96, 16], [91, 22], [87, 21], [81, 9], [77, 8], [73, 17], [68, 23], [61, 26], [57, 27], [55, 24], [61, 22], [58, 16], [49, 13], [43, 13], [41, 18], [35, 29], [34, 33], [29, 35], [24, 37], [20, 39], [17, 40], [17, 43], [13, 45], [13, 43], [16, 39], [12, 39], [8, 43], [2, 43], [-1, 39]],
  [[114, -23], [115, -18], [123, -16], [130, -13], [137, -13], [141, -17], [145, -12], [150, -19], [153, -26], [151, -32], [146, -39], [140, -37], [135, -34], [131, -32], [121, -34], [115, -34]],
  [[-8, 50], [-4, 51], [-5, 58], [-2, 59], [1, 54], [0, 51]], [[-10, 51], [-10, 55], [-6, 56], [-6, 51]],
  [[-24, 65], [-19, 67], [-13, 66], [-14, 64], [-21, 63]],
  [[47, -13], [50, -16], [47, -25], [44, -25], [43, -20]],
  [[131, 31], [133, 34], [138, 36], [140, 42], [144, 44], [146, 42], [141, 38], [140, 34], [135, 33]],
  [[120, 19], [123, 18], [122, 13], [124, 12], [126, 9], [127, 6], [124, 5], [121, 9], [120, 14]],
  [[96, 5], [102, 1], [106, -6], [113, -7], [118, -8], [111, -9], [104, -7], [99, -3]],
  [[109, 2], [115, 6], [120, 7], [119, 2], [117, -4], [111, -3]],
  [[131, -2], [139, -3], [145, -5], [151, -10], [145, -10], [140, -8], [135, -6]],
  [[174, -35], [178, -37], [178, -39], [175, -42], [173, -41], [174, -38]],
  [[172, -41], [174, -42], [171, -45], [167, -47], [166, -45]],
  [[-84, 22], [-78, 23], [-74, 20], [-79, 21]], [[-74, 20], [-68, 20], [-69, 18], [-73, 18]],
];

const anchors: readonly (readonly [Point, Point])[] = [
  [[30.70, 36.90], [231, 69]], // Antalya
  [[46.68, 24.69], [244, 91]], // Riyadh
  [[-75.32, -11.14], [116, 104]], // Junín
  [[30.52, 50.45], [236, 35]], // Kyiv
  [[56.25, 26.18], [277, 73]], // Khasab
  [[47.81, 30.51], [264, 52]], // Basra
  [[125.61, 7.07], [351, 91]], // Davao
  [[114.06, 22.54], [316, 61]], // Shenzhen
  [[139.69, 35.68], [367, 54]], // Tokyo
  [[-34, 20], [163, 82]], // Atlantic market proxy
  [[-115.14, 36.17], [70, 53]], // Las Vegas
  [[174.78, -41.29], [382, 132]], // Wellington
  [[13.40, 52.52], [207, 37]], // Berlin
  [[7.40, 9.08], [207, 94]], // Abuja
  [[-6.85, 34.02], [185, 56]], // Rabat
  [[0, 0], [336, 34]], // Mercury, outside geographic coordinates
];

export function locate(width: number, height: number, colors: readonly RGB[]): Raster {
  const tile = new Raster(width, height, sea);
  const map = ([lon, lat]: Point): Point => [10 + (lon + 180) * (width - 20) / 360, 25 + (80 - lat) * .77];
  const label = (text: string, x: number, y: number, size: number, color: RGB = ink) => {
    drawText((l, t, w, h) => tile.rect(l, t, w, h, color), text, x, y, size, titleFace);
  };
  const frameEnd = height - 20;
  for (let lon = -150; lon <= 150; lon += 30) {
    const [x] = map([lon, 0]);
    tile.rect(x, 24, 1, frameEnd - 24, grid);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const [, y] = map([0, lat]);
    tile.rect(8, y, width - 16, 1, grid);
  }
  for (const shore of shores) {
    const p = shore.map(map);
    tile.shape(p, land);
    tile.stroke([...p, p[0]], 0.85, edge);
  }
  tile.ellipse(305, 29, 6, 5, rgb('#A79E95'));
  tile.stroke([[294, 33], [298, 30], [309, 26], [315, 26]], 1, ink);
  const positions = anchors.map(([location, pin], i) => ({ pin, origin: i === 15 ? [305, 29] as Point : map(location), id: i + 1 }));
  for (const { pin, origin, id } of positions) {
    tile.stroke([origin, pin], 1.15, colors[id - 1]);
    tile.ellipse(origin[0], origin[1], 1.65, 1.65, colors[id - 1]);
  }
  for (const { pin: [x, y], id } of positions) {
    const radius = id > 9 ? 9 : 7;
    for (const { pin, id: other } of positions.slice(0, id - 1)) {
      if (Math.hypot(x - pin[0], y - pin[1]) <= radius + (other > 9 ? 9 : 7) + 3) {
        throw new Error(`Map badges ${other} and ${id} touch`);
      }
    }
    tile.ellipse(x, y, radius + 1, radius + 1, cream);
    tile.ellipse(x, y, radius, radius, colors[id - 1]);
    const number = String(id);
    label(number, x - Math.floor(textWidth(number, 9, titleFace) / 2), y - 4, 9, cream);
  }
  tile.rect(0, 0, width, 21, cream);
  tile.rect(0, 0, width, 2, ink);
  label('WORLD LOCATOR', 7, 6, 11);
  const key = '16 DISPATCHES';
  label(key, width - 7 - textWidth(key, 9, titleFace), 7, 9);
  tile.rect(0, frameEnd, width, 1, edge);
  label('NUMBERED BY STORY · LINES ANCHOR TO EACH LOCATION', 7, frameEnd + 6, 9);
  return tile;
}
