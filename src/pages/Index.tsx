import { Droplets, Building2, AlertTriangle, TrendingDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { WaterGauge } from "@/components/WaterGauge";
import { StatCard } from "@/components/StatCard";
import { AlertsPanel } from "@/components/AlertsPanel";
import { CompanyCard } from "@/components/CompanyCard";
import { useDashboardData } from "@/hooks/use-water-data";

export default function Dashboard() {
  const { data, isLoading, isError } = useDashboardData();

  if (isLoading) {
    return <div className="container py-8 text-muted-foreground">Loading dashboard data...</div>;
  }

  if (isError || !data) {
    return <div className="container py-8 text-destructive">Failed to load dashboard data.</div>;
  }

  const overallStatus = data.wqi >= 70 ? "safe" : data.wqi >= 50 ? "warning" : "critical";
  const sortedCompanies = [...data.companies].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="container py-8 space-y-8">
      {/* Hero */}
      <section className="hero-gradient rounded-2xl p-8 md:p-12 text-primary-foreground">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Water Transparency Dashboard
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-lg">
              Monitoring industrial water use and its impact on nearby communities. 
              Real-time data for public accountability.
            </p>
            <div className="flex items-center gap-2 mt-4 text-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-foreground" />
              </span>
              System Status: <span className="font-semibold capitalize">{overallStatus}</span>
            </div>
          </div>
          <WaterGauge value={Math.round(data.wqi)} size={180} />
        </div>
      </section>

      {/* Key Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Water Extracted Today"
          value={data.stats.extractedToday}
          unit="MLD"
          icon={<Droplets className="h-5 w-5" />}
        />
        <StatCard
          title="Avg. Groundwater Level"
          value={data.stats.groundwaterAvg}
          unit="m"
          icon={<TrendingDown className="h-5 w-5" />}
          status={data.stats.groundwaterAvg > 14 ? "warning" : undefined}
        />
        <StatCard
          title="Active Companies"
          value={data.stats.activeCompanies}
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          title="Active Alerts"
          value={data.stats.alertsCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          status={data.stats.alertsCount > 3 ? "critical" : data.stats.alertsCount > 0 ? "warning" : undefined}
        />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl card-elevated p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Water Usage Trends</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.trendData}>
              <defs>
                <linearGradient id="colorIndustrial" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(210,100%,45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(210,100%,45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNatural" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152,69%,40%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(152,69%,40%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,20%,90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(213,15%,50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(213,15%,50%)" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(210,20%,90%)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
              <Area type="monotone" dataKey="industrial" stroke="hsl(210,100%,45%)" fill="url(#colorIndustrial)" strokeWidth={2} name="Industrial Use (MLD)" />
              <Area type="monotone" dataKey="natural" stroke="hsl(152,69%,40%)" fill="url(#colorNatural)" strokeWidth={2} name="Natural Recharge (MLD)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl card-elevated p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Groundwater Level</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,20%,90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(213,15%,50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(213,15%,50%)" unit="m" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(210,20%,90%)" }} />
              <Line type="monotone" dataKey="groundwater" stroke="hsl(38,92%,50%)" strokeWidth={2.5} dot={{ r: 3 }} name="Depth (meters)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Alerts + Top Companies */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertsPanel alerts={data.alerts} />
        <div className="bg-card rounded-xl card-elevated p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Top Companies by Score</h3>
          {sortedCompanies.map(c => (
            <CompanyCard key={c.id} company={c} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
