import { deflateSync } from 'node:zlib';

export type RGB = readonly [number, number, number];
export type Point = readonly [number, number];

export function rgb(hex: string): RGB {
  const color = Number.parseInt(hex.replace(/^#/, ''), 16);
  return [(color >>> 16) & 255, (color >>> 8) & 255, color & 255];
}

const crcTable = Uint32Array.from({ length: 256 }, (_, entry) => {
  let value = entry;
  for (let i = 0; i < 8; i++) {
    value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  }
  return value >>> 0;
});

function pngChunk(kind: string, data: Buffer): Buffer {
  const bytes = Buffer.alloc(data.length + 12);
  bytes.writeUInt32BE(data.length, 0);
  bytes.write(kind, 4, 4, 'ascii');
  data.copy(bytes, 8);
  let crc = 0xffffffff;
  for (let i = 4; i < bytes.length - 4; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 255];
  }
  bytes.writeUInt32BE((crc ^ 0xffffffff) >>> 0, bytes.length - 4);
  return bytes;
}

export class Raster {
  readonly width: number;
  readonly height: number;
  readonly pixels: Buffer;

  constructor(width: number, height: number, base: RGB) {
    this.width = width;
    this.height = height;
    this.pixels = Buffer.alloc(width * height * 3);
    this.pixels.fill(Buffer.from(base));
  }

  rect(x: number, y: number, width: number, height: number, [r, g, b]: RGB): void {
    const left = Math.max(0, Math.round(x));
    const right = Math.min(this.width, Math.round(x + width));
    const top = Math.max(0, Math.round(y));
    const bottom = Math.min(this.height, Math.round(y + height));
    for (let row = top; row < bottom; row++) {
      let i = (row * this.width + left) * 3;
      const end = (row * this.width + right) * 3;
      for (; i < end; i += 3) {
        this.pixels[i] = r;
        this.pixels[i + 1] = g;
        this.pixels[i + 2] = b;
      }
    }
  }

  shape(points: readonly Point[], color: RGB): void {
    if (points.length < 3) return;
    const top = Math.max(0, Math.ceil(Math.min(...points.map(p => p[1])) - 0.5));
    const bottom = Math.min(this.height, Math.ceil(Math.max(...points.map(p => p[1])) - 0.5));
    for (let row = top; row < bottom; row++) {
      const y = row + 0.5;
      const crossings: number[] = [];
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [ax, ay] = points[j];
        const [bx, by] = points[i];
        if ((ay > y) !== (by > y)) crossings.push(ax + (y - ay) * (bx - ax) / (by - ay));
      }
      crossings.sort((a, b) => a - b);
      for (let i = 0; i + 1 < crossings.length; i += 2) {
        const start = Math.ceil(crossings[i] - 0.5);
        const end = Math.ceil(crossings[i + 1] - 0.5);
        this.rect(start, row, end - start, 1, color);
      }
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: RGB): void {
    if (rx <= 0 || ry <= 0) return;
    const top = Math.max(0, Math.ceil(cy - ry - 0.5));
    const bottom = Math.min(this.height, Math.ceil(cy + ry - 0.5));
    for (let y = top; y < bottom; y++) {
      const span = rx * Math.sqrt(1 - ((y + 0.5 - cy) / ry) ** 2);
      const left = Math.ceil(cx - span - 0.5);
      const right = Math.ceil(cx + span - 0.5);
      this.rect(left, y, right - left, 1, color);
    }
  }

  stroke(points: readonly Point[], thickness: number, color: RGB): void {
    const r = thickness / 2;
    for (let i = 0; i < points.length; i++) {
      const [x, y] = points[i];
      if (i > 0) {
        const [a, b] = points[i - 1];
        const length = Math.hypot(x - a, y - b);
        if (length > 0) {
          const nx = (y - b) / length * r;
          const ny = (a - x) / length * r;
          this.shape([[a + nx, b + ny], [x + nx, y + ny], [x - nx, y - ny], [a - nx, b - ny]], color);
        }
      }
      this.ellipse(x, y, r, r, color);
    }
  }

  paste(tile: Raster, x: number, y: number): void {
    if (x < 0 || y < 0 || x + tile.width > this.width || y + tile.height > this.height) {
      throw new Error('Tile is outside page');
    }
    const rowBytes = 3 * tile.width;
    for (let row = 0; row < tile.height; row++) {
      tile.pixels.copy(this.pixels, 3 * (x + (y + row) * this.width), row * rowBytes, (row + 1) * rowBytes);
    }
  }

  png(): Buffer {
    const header = Buffer.alloc(13);
    header.writeUInt32BE(this.width, 0);
    header.writeUInt32BE(this.height, 4);
    header[8] = 8; // eight bits per channel
    header[9] = 2; // RGB, no alpha
    const stride = 3 * this.width;
    const scanlines = Buffer.alloc((stride + 1) * this.height);
    for (let y = 0; y < this.height; y++) {
      const source = stride * y;
      const destination = (stride + 1) * y;
      this.pixels.copy(scanlines, destination + 1, source, source + stride);
    }
    return Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      pngChunk('IHDR', header),
      pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
      pngChunk('IEND', Buffer.alloc(0)),
    ]);
  }
}
