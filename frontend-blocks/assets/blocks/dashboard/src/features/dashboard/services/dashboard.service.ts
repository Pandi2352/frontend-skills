import type { ChartPart, ChartRow } from '@/components/shared/charts';
import { api } from '@/services/api';

export const PERIODS = ['7d', '30d', '12m'] as const;
export type Period = (typeof PERIODS)[number];

export interface Metric {
  value: number;
  /** 0.12 is +12% against the period before. */
  change?: number;
}

export interface DashboardData {
  revenue: Metric;
  orders: Metric;
  customers: Metric;
  refunds: Metric;
  trend: ChartRow[];
  categories: ChartPart[];
  recent: { id: string; customer: string; total: number; status: 'paid' | 'open' | 'refunded'; date: string }[];
}

// Replace with the real numbers of the project. One request, so all numbers belong together.
export const dashboardService = {
  get: (period: Period, signal?: AbortSignal) => api.get<DashboardData>('/dashboard', { query: { period }, signal }),
};
