export function getChartMax(values: number[], fallback = 1) {
  return Math.max(...values, fallback);
}

export function buildNormalizedPoints(
  values: number[],
  width: number,
  height: number,
  padding = { top: 24, right: 16, bottom: 32, left: 16 }
) {
  const max = getChartMax(values);
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const stepX = innerWidth / Math.max(values.length - 1, 1);

  return values.map((value, index) => ({
    x: padding.left + index * stepX,
    y: padding.top + innerHeight - (value / max) * innerHeight,
    value,
  }));
}

export function buildSvgPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

export function buildAreaPath(
  points: { x: number; y: number }[],
  baselineY: number
) {
  if (points.length === 0) return "";

  const linePath = buildSvgPath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];

  return `${linePath} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`;
}
