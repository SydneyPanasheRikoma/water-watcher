import { villages, companies } from "@/lib/data";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus, MapPin, Users } from "lucide-react";

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "falling") return <TrendingDown className="h-4 w-4 status-critical" />;
  if (trend === "rising") return <TrendingUp className="h-4 w-4 status-safe" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export default function CommunityPage() {
  const affectedCount = villages.filter(v => v.status !== "safe").length;

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Community Impact</h1>
        <p className="text-muted-foreground">How industrial water use affects nearby communities</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl card-elevated p-5">
          <p className="text-sm text-muted-foreground">Communities Monitored</p>
          <p className="text-3xl font-bold text-foreground">{villages.length}</p>
        </div>
        <div className="bg-card rounded-xl card-elevated p-5">
          <p className="text-sm text-muted-foreground">Areas Affected</p>
          <p className="text-3xl font-bold status-warning">{affectedCount}</p>
        </div>
        <div className="bg-card rounded-xl card-elevated p-5">
          <p className="text-sm text-muted-foreground">Total Population</p>
          <p className="text-3xl font-bold text-foreground">{villages.reduce((s, v) => s + v.population, 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Village cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {villages.map(v => (
          <div key={v.id} className="bg-card rounded-xl card-elevated p-5 border border-transparent hover:border-primary/20 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">{v.name}</h3>
              </div>
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                v.status === "safe" && "bg-status-safe status-safe",
                v.status === "warning" && "bg-status-warning status-warning",
                v.status === "critical" && "bg-status-critical status-critical",
              )}>
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  v.status === "safe" && "bg-status-safe-solid",
                  v.status === "warning" && "bg-status-warning-solid",
                  v.status === "critical" && "bg-status-critical-solid",
                )} />
                {v.status}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Groundwater Level</span>
                <span className="font-semibold text-foreground">{v.groundwaterLevel}m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Trend</span>
                <span className="flex items-center gap-1 font-medium capitalize text-foreground">
                  <TrendIcon trend={v.trend} /> {v.trend}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Population</span>
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  {v.population.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Visual Map */}
      <div className="bg-card rounded-xl card-elevated p-5">
        <h3 className="text-base font-semibold text-foreground mb-4">Area Overview</h3>
        <div className="relative w-full aspect-[2/1] bg-accent/50 rounded-xl overflow-hidden">
          {/* Simple visual map */}
          <svg viewBox="0 0 400 200" className="w-full h-full">
            {/* Grid lines */}
            {Array.from({ length: 9 }, (_, i) => (
              <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="200" stroke="hsl(210,20%,85%)" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 5 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 50} x2="400" y2={i * 50} stroke="hsl(210,20%,85%)" strokeWidth="0.5" />
            ))}

            {/* Companies */}
            {companies.map((c, i) => {
              const x = 60 + (i % 3) * 120;
              const y = 40 + Math.floor(i / 3) * 80;
              const fill = c.status === "safe" ? "hsl(152,69%,40%)" : c.status === "warning" ? "hsl(38,92%,50%)" : "hsl(0,72%,51%)";
              return (
                <g key={c.id}>
                  <rect x={x - 6} y={y - 6} width="12" height="12" rx="2" fill={fill} opacity="0.8" />
                  <text x={x} y={y + 20} textAnchor="middle" fontSize="7" fill="hsl(213,15%,50%)">{c.name.split(" ")[0]}</text>
                </g>
              );
            })}

            {/* Villages */}
            {villages.map((v, i) => {
              const x = 40 + (i % 4) * 90;
              const y = 100 + Math.floor(i / 4) * 60;
              const fill = v.status === "safe" ? "hsl(210,100%,45%)" : v.status === "warning" ? "hsl(38,92%,50%)" : "hsl(0,72%,51%)";
              return (
                <g key={v.id}>
                  <circle cx={x} cy={y} r="5" fill={fill} opacity="0.7" />
                  <circle cx={x} cy={y} r="8" fill={fill} opacity="0.15" />
                  <text x={x} y={y + 16} textAnchor="middle" fontSize="7" fill="hsl(213,15%,50%)">{v.name}</text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur-sm rounded-lg p-2 text-xs flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Company</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Village</span>
          </div>
        </div>
      </div>
    </div>
  );
}
