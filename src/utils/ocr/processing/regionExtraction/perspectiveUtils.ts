import { Point } from './types';

export function computePerspectiveTransform(src: Point[], dst: Point[]): number[] {
  const a = [
    [src[0].x, src[0].y, 1, 0, 0, 0, -dst[0].x * src[0].x, -dst[0].x * src[0].y],
    [0, 0, 0, src[0].x, src[0].y, 1, -dst[0].y * src[0].x, -dst[0].y * src[0].y],
    [src[1].x, src[1].y, 1, 0, 0, 0, -dst[1].x * src[1].x, -dst[1].x * src[1].y],
    [0, 0, 0, src[1].x, src[1].y, 1, -dst[1].y * src[1].x, -dst[1].y * src[1].y],
    [src[2].x, src[2].y, 1, 0, 0, 0, -dst[2].x * src[2].x, -dst[2].x * src[2].y],
    [0, 0, 0, src[2].x, src[2].y, 1, -dst[2].y * src[2].x, -dst[2].y * src[2].y],
    [src[3].x, src[3].y, 1, 0, 0, 0, -dst[3].x * src[3].x, -dst[3].x * src[3].y],
    [0, 0, 0, src[3].x, src[3].y, 1, -dst[3].y * src[3].x, -dst[3].y * src[3].y]
  ];
  
  const b = [dst[0].x, dst[0].y, dst[1].x, dst[1].y, dst[2].x, dst[2].y, dst[3].x, dst[3].y];
  const h = gaussianElimination(a, b);
  h.push(1.0);
  return h;
}

export function applyTransform(transform: number[], x: number, y: number): Point {
  const w = transform[6] * x + transform[7] * y + transform[8];
  const srcX = (transform[0] * x + transform[1] * y + transform[2]) / w;
  const srcY = (transform[3] * x + transform[4] * y + transform[5]) / w;
  return { x: srcX, y: srcY };
}

function gaussianElimination(a: number[][], b: number[]): number[] {
  const n = a.length;
  
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    let maxVal = Math.abs(a[i][i]);
    
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(a[k][i]) > maxVal) {
        maxVal = Math.abs(a[k][i]);
        maxRow = k;
      }
    }
    
    if (maxRow !== i) {
      [a[i], a[maxRow]] = [a[maxRow], a[i]];
      [b[i], b[maxRow]] = [b[maxRow], b[i]];
    }
    
    for (let k = i + 1; k < n; k++) {
      const c = -a[k][i] / a[i][i];
      for (let j = i; j < n; j++) {
        if (i === j) {
          a[k][j] = 0;
        } else {
          a[k][j] += c * a[i][j];
        }
      }
      b[k] += c * b[i];
    }
  }
  
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = b[i] / a[i][i];
    for (let k = i - 1; k >= 0; k--) {
      b[k] -= a[k][i] * x[i];
    }
  }
  
  return x;
}
