
import { Point } from './types';

export function distance(point1: Point, point2: Point): number {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + 
    Math.pow(point2.y - point1.y, 2)
  );
}

export function getPixel(imgData: ImageData, x: number, y: number): [number, number, number, number] {
  const idx = (y * imgData.width + x) * 4;
  return [
    imgData.data[idx],
    imgData.data[idx + 1],
    imgData.data[idx + 2],
    imgData.data[idx + 3]
  ];
}
