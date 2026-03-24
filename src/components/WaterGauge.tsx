interface WaterGaugeProps {
  value: number;
  size?: number;
  label?: string;
}

export function WaterGauge({ value, size = 200, label = "Water Equality Index" }: WaterGaugeProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - value) / 100) * circumference;
  const color =
    value >= 70 ? "hsl(var(--status-safe))" :
    value >= 50 ? "hsl(var(--status-warning))" :
    "hsl(var(--status-critical))";

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 100 100" className="animate-gauge">
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="8"
        />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          transform="rotate(-90 50 50)"
          className="transition-all duration-1000"
        />
        <text x="50" y="46" textAnchor="middle" className="fill-foreground text-[1.5rem] font-bold" style={{ fontFamily: "Inter" }}>
          {value}
        </text>
        <text x="50" y="58" textAnchor="middle" className="fill-muted-foreground text-[0.45rem]">
          out of 100
        </text>
      </svg>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
