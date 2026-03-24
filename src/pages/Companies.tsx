import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Search, ArrowLeft } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useCompaniesData, useCompanyData } from "@/hooks/use-water-data";
import { CompanyCard, StatusBadge } from "@/components/CompanyCard";
import { cn } from "@/lib/utils";

function CompanyDetail({ companyId }: { companyId: string }) {
  const { data: company, isLoading, isError } = useCompanyData(companyId);

  if (isLoading) return <p className="text-muted-foreground p-8">Loading company details...</p>;
  if (isError) return <p className="text-destructive p-8">Failed to load company details.</p>;
  if (!company) return <p className="text-muted-foreground p-8">Company not found.</p>;

  const scoreColor =
    company.score >= 80 ? "status-safe" :
    company.score >= 60 ? "status-warning" :
    "status-critical";

  const summaryStats: Array<{ label: string; value: string | number; className?: string }> = [
    { label: "Daily Usage", value: `${company.dailyUsageMLD} MLD` },
    { label: "Responsibility Score", value: `${company.score}/100`, className: scoreColor },
    { label: "Violations", value: company.violations },
    { label: "Water Credits", value: company.credits },
  ];

  return (
    <div className="container py-8 space-y-6">
      <Link to="/companies" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Companies
      </Link>

      <div className="bg-card rounded-xl card-elevated p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
              {company.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
              <p className="text-muted-foreground">{company.industry}</p>
            </div>
          </div>
          <StatusBadge status={company.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryStats.map(s => (
          <div key={s.label} className="bg-card rounded-xl card-elevated p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn("text-xl font-bold", s.className || "text-foreground")}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl card-elevated p-5">
        <h3 className="text-base font-semibold mb-4 text-foreground">Usage History</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={company.history}>
            <defs>
              <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(210,100%,45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(210,100%,45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,20%,90%)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(213,15%,50%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(213,15%,50%)" />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(210,20%,90%)" }} />
            <Area type="monotone" dataKey="usage" stroke="hsl(210,100%,45%)" fill="url(#compGrad)" strokeWidth={2} name="Usage (MLD)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  const { id } = useParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: companies = [], isLoading, isError } = useCompaniesData();

  const filtered = useMemo(() =>
    companies.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.industry.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    }), [companies, search, statusFilter]);

  if (id) return <CompanyDetail companyId={id} />;

  if (isLoading) {
    return <div className="container py-8 text-muted-foreground">Loading companies...</div>;
  }

  if (isError) {
    return <div className="container py-8 text-destructive">Failed to load companies.</div>;
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Companies</h1>
        <p className="text-muted-foreground">Track industrial water usage and responsibility scores</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search companies or industries..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          {["all", "safe", "warning", "critical"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
                statusFilter === s ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted border"
              )}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(c => <CompanyCard key={c.id} company={c} />)}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No companies match your search.</p>
      )}
    </div>
  );
}
