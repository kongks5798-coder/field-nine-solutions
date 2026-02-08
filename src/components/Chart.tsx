type Point = { t: string; v: number };

export function BarChart({
  data,
  title,
}: {
  data: Point[];
  title?: string;
}) {
  const max = Math.max(...data.map((d) => d.v), 1);
  const width = 600;
  const height = 200;
  const barWidth = Math.max(8, Math.floor(width / Math.max(data.length, 1)) - 4);
  return (
    <div className="w-full">
      {title ? <h3 className="text-sm font-medium opacity-80 mb-2">{title}</h3> : null}
      <svg width={width} height={height} className="rounded-lg border border-black/10 dark:border-white/15 bg-white/60 dark:bg-black/40">
        {data.map((d, i) => {
          const h = Math.round((d.v / max) * (height - 20));
          const x = i * (barWidth + 4) + 10;
          const y = height - h - 10;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={h} fill="currentColor" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
