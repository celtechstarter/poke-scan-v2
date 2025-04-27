
export interface Point {
  x: number;
  y: number;
}

export interface CardEdges {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

export interface RegionQualityOptions {
  minWhitePercentage?: number;
  minEdgeContrast?: number;
}
