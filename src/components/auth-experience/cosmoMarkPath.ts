/** Arco exclusivo Cosmo — forma de marca, não tipografia */
export const COSMO_C_PATH =
  "M 78 28 C 48 28 28 48 28 72 C 28 96 48 116 78 116 C 88 116 96 112 102 106";

export const COSMO_VIEWBOX = 144;

export interface PathPoint {
  x: number;
  y: number;
}

export function samplePathPoints(
  pathD: string,
  count: number,
  viewSize = COSMO_VIEWBOX
): PathPoint[] {
  if (typeof document === "undefined") {
    return Array.from({ length: count }, (_, i) => ({
      x: viewSize * 0.35,
      y: viewSize * (0.2 + (i / count) * 0.65),
    }));
  }

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathD);
  svg.appendChild(path);
  document.body.appendChild(svg);

  const length = path.getTotalLength();
  const points: PathPoint[] = [];

  for (let i = 0; i < count; i += 1) {
    const at = path.getPointAtLength((length * i) / Math.max(count - 1, 1));
    points.push({ x: at.x, y: at.y });
  }

  document.body.removeChild(svg);
  return points;
}
