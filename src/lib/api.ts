import {
  companies,
  villages,
  generateAlerts,
  getKeyStats,
  getUsageTrendData,
  getWaterEqualityIndex,
  type Alert,
  type Company,
  type Village,
} from "@/lib/data";

export interface KeyStats {
  extractedToday: number;
  groundwaterAvg: number;
  activeCompanies: number;
  alertsCount: number;
}

export interface TrendPoint {
  month: string;
  industrial: number;
  natural: number;
  groundwater: number;
}

export interface DashboardSnapshot {
  wqi: number;
  stats: KeyStats;
  alerts: Alert[];
  trendData: TrendPoint[];
  companies: Company[];
}

export interface CommunitySnapshot {
  villages: Village[];
  companies: Company[];
}

const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";
const hasBackend = Boolean(baseUrl);

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${path}`);
  }
  return (await response.json()) as T;
}

function normalizeAlertTimestamps(alerts: Alert[]): Alert[] {
  return alerts.map((alert) => ({
    ...alert,
    timestamp: alert.timestamp instanceof Date ? alert.timestamp : new Date(alert.timestamp),
  }));
}

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (hasBackend) {
    const data = await getJson<DashboardSnapshot>("/api/dashboard");
    return {
      ...data,
      alerts: normalizeAlertTimestamps(data.alerts),
    };
  }

  return {
    wqi: getWaterEqualityIndex(),
    stats: getKeyStats(),
    alerts: generateAlerts(),
    trendData: getUsageTrendData(),
    companies,
  };
}

export async function fetchCompanies(): Promise<Company[]> {
  if (hasBackend) {
    return getJson<Company[]>("/api/companies");
  }

  return companies;
}

export async function fetchCompanyById(companyId: string): Promise<Company | null> {
  if (hasBackend) {
    const response = await fetch(`${baseUrl}/api/companies/${companyId}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`Request failed (${response.status}) for /api/companies/${companyId}`);
    }
    return (await response.json()) as Company;
  }

  return companies.find((company) => company.id === companyId) ?? null;
}

export async function fetchCommunitySnapshot(): Promise<CommunitySnapshot> {
  if (hasBackend) {
    return getJson<CommunitySnapshot>("/api/community");
  }

  return {
    villages,
    companies,
  };
}
