import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  status?: "safe" | "warning" | "critical";
}

export function StatCard({ title, value, unit, icon, status }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl p-5 card-elevated flex items-start gap-4">
      <div className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
        status === "critical" ? "bg-status-critical text-primary-foreground" :
        status === "warning" ? "bg-status-warning text-primary-foreground" :
        "bg-primary/10 text-primary"
      )}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold tracking-tight text-foreground">
          {value}
          {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}
