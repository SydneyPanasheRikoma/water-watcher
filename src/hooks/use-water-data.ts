import { useQuery } from "@tanstack/react-query";
import {
  fetchCommunitySnapshot,
  fetchCompanies,
  fetchCompanyById,
  fetchDashboardSnapshot,
} from "@/lib/api";

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardSnapshot,
    refetchInterval: 15000,
  });
}

export function useCompaniesData() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: fetchCompanies,
  });
}

export function useCompanyData(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId],
    queryFn: () => fetchCompanyById(companyId),
    enabled: Boolean(companyId),
  });
}

export function useCommunityData() {
  return useQuery({
    queryKey: ["community"],
    queryFn: fetchCommunitySnapshot,
    refetchInterval: 15000,
  });
}
