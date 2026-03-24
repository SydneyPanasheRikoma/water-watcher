// Simulated live data for The Blue Ledger

export interface Company {
  id: string;
  name: string;
  industry: string;
  dailyUsageMLD: number; // million liters/day
  score: number; // 0-100
  alerts: number;
  violations: number;
  credits: number;
  status: "safe" | "warning" | "critical";
  lat: number;
  lng: number;
  history: { month: string; usage: number }[];
}

export interface Village {
  id: string;
  name: string;
  population: number;
  groundwaterLevel: number; // meters below ground
  trend: "rising" | "stable" | "falling";
  status: "safe" | "warning" | "critical";
  lat: number;
  lng: number;
}

export interface Alert {
  id: string;
  type: "warning" | "critical" | "info";
  message: string;
  company?: string;
  timestamp: Date;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const companies: Company[] = [
  {
    id: "c1", name: "AquaChem Industries", industry: "Chemical Manufacturing",
    dailyUsageMLD: 4.2, score: 72, alerts: 2, violations: 1, credits: 15,
    status: "warning", lat: 19.08, lng: 72.88,
    history: months.map((m, i) => ({ month: m, usage: 3.8 + Math.sin(i) * 0.8 })),
  },
  {
    id: "c2", name: "GreenTex Fabrics", industry: "Textile",
    dailyUsageMLD: 2.8, score: 88, alerts: 0, violations: 0, credits: 42,
    status: "safe", lat: 19.12, lng: 72.85,
    history: months.map((m, i) => ({ month: m, usage: 2.5 + Math.cos(i) * 0.5 })),
  },
  {
    id: "c3", name: "SteelForge Ltd", industry: "Steel Manufacturing",
    dailyUsageMLD: 6.1, score: 45, alerts: 5, violations: 3, credits: 0,
    status: "critical", lat: 19.05, lng: 72.92,
    history: months.map((m, i) => ({ month: m, usage: 5.5 + Math.sin(i * 0.8) * 1.2 })),
  },
  {
    id: "c4", name: "PurePharm Solutions", industry: "Pharmaceuticals",
    dailyUsageMLD: 1.9, score: 91, alerts: 0, violations: 0, credits: 58,
    status: "safe", lat: 19.1, lng: 72.9,
    history: months.map((m, i) => ({ month: m, usage: 1.7 + Math.sin(i * 0.5) * 0.3 })),
  },
  {
    id: "c5", name: "AgriGrow Exports", industry: "Agriculture",
    dailyUsageMLD: 3.5, score: 67, alerts: 1, violations: 1, credits: 8,
    status: "warning", lat: 19.07, lng: 72.86,
    history: months.map((m, i) => ({ month: m, usage: 3.0 + Math.cos(i * 0.7) * 0.9 })),
  },
  {
    id: "c6", name: "CoolBreeze HVAC", industry: "Manufacturing",
    dailyUsageMLD: 1.2, score: 94, alerts: 0, violations: 0, credits: 65,
    status: "safe", lat: 19.11, lng: 72.87,
    history: months.map((m, i) => ({ month: m, usage: 1.0 + Math.sin(i * 0.3) * 0.3 })),
  },
];

export const villages: Village[] = [
  { id: "v1", name: "Chandpur", population: 3200, groundwaterLevel: 12.4, trend: "falling", status: "warning", lat: 19.06, lng: 72.89 },
  { id: "v2", name: "Lakshminagar", population: 5600, groundwaterLevel: 8.2, trend: "stable", status: "safe", lat: 19.13, lng: 72.84 },
  { id: "v3", name: "Rampur", population: 2100, groundwaterLevel: 18.7, trend: "falling", status: "critical", lat: 19.04, lng: 72.93 },
  { id: "v4", name: "Govindpuri", population: 4400, groundwaterLevel: 10.1, trend: "stable", status: "safe", lat: 19.09, lng: 72.91 },
  { id: "v5", name: "Neelgaon", population: 1800, groundwaterLevel: 15.3, trend: "falling", status: "warning", lat: 19.07, lng: 72.87 },
];

export const generateAlerts = (): Alert[] => [
  { id: "a1", type: "critical", message: "Groundwater level in Rampur dropped below safe threshold", company: "SteelForge Ltd", timestamp: new Date(Date.now() - 1000 * 60 * 12) },
  { id: "a2", type: "warning", message: "AquaChem exceeded daily extraction limit by 8%", company: "AquaChem Industries", timestamp: new Date(Date.now() - 1000 * 60 * 45) },
  { id: "a3", type: "warning", message: "Chandpur groundwater trend shows accelerated decline", timestamp: new Date(Date.now() - 1000 * 60 * 120) },
  { id: "a4", type: "info", message: "PurePharm Solutions earned 5 new water credits", company: "PurePharm Solutions", timestamp: new Date(Date.now() - 1000 * 60 * 180) },
  { id: "a5", type: "critical", message: "SteelForge Ltd recorded 3rd violation this quarter", company: "SteelForge Ltd", timestamp: new Date(Date.now() - 1000 * 60 * 300) },
];

export const getWaterEqualityIndex = () => 68;

export const getKeyStats = () => ({
  extractedToday: 19.7,
  groundwaterAvg: 12.9,
  activeCompanies: companies.length,
  alertsCount: generateAlerts().filter(a => a.type !== "info").length,
});

export const getUsageTrendData = () =>
  months.map((m, i) => ({
    month: m,
    industrial: 17 + Math.sin(i * 0.8) * 3,
    natural: 22 - Math.sin(i * 0.5) * 2,
    groundwater: 14 - i * 0.3 + Math.sin(i) * 1.5,
  }));
