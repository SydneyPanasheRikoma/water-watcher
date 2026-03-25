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

function roundTo(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function addChartActivity(data: DashboardSnapshot): TrendPoint[] {
  const trendData = [...data.trendData];
  if (trendData.length === 0) {
    return trendData;
  }

  const nonZeroPoints = trendData.filter(
    (point) => point.industrial > 0 || point.natural > 0 || point.groundwater > 0
  ).length;

  const anchorIndex = trendData.findLastIndex(
    (point) => point.industrial > 0 || point.natural > 0 || point.groundwater > 0
  );

  if (anchorIndex >= 0 && nonZeroPoints <= 3) {
    const anchor = trendData[anchorIndex];
    const anchorIndustrial = Math.max(anchor.industrial, data.stats.extractedToday * 0.7, 1);
    const anchorNatural = Math.max(anchor.natural, anchorIndustrial * 1.1, 1);
    const anchorGroundwater = Math.max(anchor.groundwater, data.stats.groundwaterAvg, 1);
    const groundwaterStart = anchorGroundwater + 1.4;

    for (let index = 0; index <= anchorIndex; index += 1) {
      const progress = anchorIndex === 0 ? 1 : (index + 1) / (anchorIndex + 1);
      const seasonalShift = Math.sin(index * 0.8);

      const industrial = Math.max(
        0,
        anchorIndustrial * (0.52 + progress * 0.48 + seasonalShift * 0.06)
      );
      const natural = Math.max(
        0,
        anchorNatural * (0.58 + progress * 0.42 + seasonalShift * 0.05)
      );
      const groundwater =
        groundwaterStart - (groundwaterStart - anchorGroundwater) * progress + seasonalShift * 0.12;

      trendData[index] = {
        ...trendData[index],
        industrial: roundTo(industrial),
        natural: roundTo(natural),
        groundwater: roundTo(groundwater),
      };
    }
  }

  const lastIndex = trendData.length - 1;
  const pulse = Math.sin(Date.now() / 15000) * 0.15;
  const latest = trendData[lastIndex];
  trendData[lastIndex] = {
    ...latest,
    industrial: roundTo(Math.max(0, latest.industrial + pulse)),
    natural: roundTo(Math.max(0, latest.natural + pulse * 0.9)),
    groundwater: roundTo(Math.max(0, latest.groundwater + pulse * 0.25)),
  };

  return trendData;
}

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (hasBackend) {
    const data = await getJson<DashboardSnapshot>("/api/dashboard");
    return {
      ...data,
      alerts: normalizeAlertTimestamps(data.alerts),
      trendData: addChartActivity(data),
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
