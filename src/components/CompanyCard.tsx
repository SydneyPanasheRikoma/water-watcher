import { cn } from "@/lib/utils";
import type { Company } from "@/lib/data";
import { Link } from "react-router-dom";

function StatusBadge({ status }: { status: Company["status"] }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
      status === "safe" && "bg-status-safe status-safe",
      status === "warning" && "bg-status-warning status-warning",
      status === "critical" && "bg-status-critical status-critical",
    )}>
      <span className={cn(
        "h-1.5 w-1.5 rounded-full",
        status === "safe" && "bg-status-safe-solid",
        status === "warning" && "bg-status-warning-solid",
        status === "critical" && "bg-status-critical-solid",
      )} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function CompanyCard({ company, compact }: { company: Company; compact?: boolean }) {
  const scoreColor =
    company.score >= 80 ? "status-safe" :
    company.score >= 60 ? "status-warning" :
    "status-critical";

  if (compact) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {company.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{company.name}</p>
            <p className="text-xs text-muted-foreground">{company.industry}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={cn("text-lg font-bold", scoreColor)}>{company.score}</span>
          <StatusBadge status={company.status} />
        </div>
      </div>
    );
  }

  return (
    <Link to={`/companies/${company.id}`} className="block">
      <div className="bg-card rounded-xl card-elevated p-5 hover:border-primary/30 border border-transparent transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {company.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{company.name}</h3>
              <p className="text-xs text-muted-foreground">{company.industry}</p>
            </div>
          </div>
          <StatusBadge status={company.status} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div>
            <p className="text-xs text-muted-foreground">Daily Usage</p>
            <p className="text-sm font-bold text-foreground">{company.dailyUsageMLD} <span className="text-xs font-normal">MLD</span></p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Score</p>
            <p className={cn("text-sm font-bold", scoreColor)}>{company.score}/100</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Alerts</p>
            <p className="text-sm font-bold text-foreground">{company.alerts}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Credits</p>
            <p className="text-sm font-bold text-primary">{company.credits}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export { StatusBadge };
