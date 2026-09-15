interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  color?: string;
}

export function Sparkline({
  values,
  width = 80,
  height = 28,
  className,
  color = "#6366f1",
}: SparklineProps) {
  if (values.length < 2) {
    return (
      <svg
        width={width}
        height={height}
        className={className}
        aria-hidden
      />
    );
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = width / (values.length - 1);

  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      className={className}
      aria-hidden
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id="spark-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color === "#6366f1" ? "url(#spark-gradient)" : color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
