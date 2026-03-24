import { cn } from "@/lib/utils";
import type { Alert } from "@/lib/data";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

function timeAgo(date: Date) {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="bg-card rounded-xl card-elevated p-5">
      <h3 className="text-base font-semibold text-foreground mb-4">Recent Alerts</h3>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "flex items-start gap-3 rounded-lg p-3 text-sm animate-fade-in-up",
              alert.type === "critical" && "bg-status-critical",
              alert.type === "warning" && "bg-status-warning",
              alert.type === "info" && "bg-muted"
            )}
          >
            <div className="mt-0.5">
              {alert.type === "critical" && <AlertCircle className="h-4 w-4 status-critical" />}
              {alert.type === "warning" && <AlertTriangle className="h-4 w-4 status-warning" />}
              {alert.type === "info" && <Info className="h-4 w-4 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground">{alert.message}</p>
              {alert.company && (
                <p className="text-xs text-muted-foreground mt-0.5">{alert.company}</p>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(alert.timestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
