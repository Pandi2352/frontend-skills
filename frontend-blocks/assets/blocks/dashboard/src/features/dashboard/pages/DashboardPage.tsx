import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CreditCard, RotateCcw, ShoppingCart, Users } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/layout/page';
import { DonutChart, LineChart, type ChartSeries } from '@/components/shared/charts';
import { DataTable, type Column } from '@/components/shared/data-table';
import { ErrorState } from '@/components/shared/states';
import { Badge } from '@/components/ui/badge';
import { Card, StatCard } from '@/components/ui/card';
import { RadioGroup } from '@/components/ui/fields';
import { appConfig } from '@/config/app.config';
import { useUrlState } from '@/hooks/useUrlState';
import { getErrorMessage } from '@/services/api-error';
import { formatIso } from '@/utils/date';
import { dashboardService, PERIODS, type DashboardData, type Period } from '../services/dashboard.service';

type Order = DashboardData['recent'][number];
const money = (value: number) =>
  new Intl.NumberFormat(appConfig.locale, { style: 'currency', currency: appConfig.currency, maximumFractionDigits: 0 }).format(value);
const count = (value: number) => new Intl.NumberFormat(appConfig.locale).format(value);

const labels: Record<Period, string> = { '7d': '7 days', '30d': '30 days', '12m': '12 months' };
const series: ChartSeries[] = [
  { key: 'revenue', label: 'Revenue', color: 1 },
  { key: 'refunds', label: 'Refunds', color: 2 },
];
const status = {
  paid: { label: 'Paid', variant: 'success' },
  open: { label: 'Open', variant: 'warning' },
  refunded: { label: 'Refunded', variant: 'neutral' },
} as const;
const columns: Column<Order>[] = [
  { id: 'customer', header: 'Customer', value: (o) => o.customer },
  { id: 'date', header: 'Date', value: (o) => formatIso(o.date.slice(0, 10), appConfig.locale, { dateStyle: 'medium' }) },
  { id: 'status', header: 'Status', value: (o) => status[o.status].label, cell: (o) => <Badge variant={status[o.status].variant}>{status[o.status].label}</Badge> },
  { id: 'total', header: 'Total', value: (o) => o.total, cell: (o) => money(o.total), align: 'end' },
];
const getId = (o: Order) => o.id;
const getName = (o: Order) => o.customer;

export function DashboardPage() {
  const [period, setPeriod] = useUrlState<Period>('period', '30d', PERIODS);
  const query = useQuery({
    queryKey: ['dashboard', period],
    queryFn: ({ signal }) => dashboardService.get(period, signal),
    placeholderData: keepPreviousData,
  });
  const { data, isPending: isLoading, isPlaceholderData: isFetching } = query;
  const error = query.error ? getErrorMessage(query.error) : undefined;
  const retry = () => void query.refetch();

  const stats = [
    { label: 'Revenue', icon: CreditCard, metric: data?.revenue, format: money },
    { label: 'Orders', icon: ShoppingCart, metric: data?.orders, format: count },
    { label: 'New customers', icon: Users, metric: data?.customers, format: count },
    { label: 'Refunds', icon: RotateCcw, metric: data?.refunds, format: money, lowerIsBetter: true },
  ];

  return (
    <PageContainer>
      <PageHeader title="Dashboard" />
      {/* One filter for everything below, so the numbers always agree. */}
      <RadioGroup<Period>
        hideLabel
        variant="segmented"
        label="Period"
        className="w-full sm:w-80"
        value={period}
        onChange={(next) => next && setPeriod(next)}
        options={PERIODS.map((value) => ({ value, label: labels[value] }))}
      />
      {error && !data ? (
        <ErrorState message={error} onRetry={retry} />
      ) : (
        <>
          {error && <ErrorState className="rounded-md border border-danger p-3" message={error} onRetry={retry} />}
          <section aria-label="Numbers" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(({ label, icon, metric, format, lowerIsBetter }) => (
              <StatCard
                key={label}
                label={label}
                icon={icon}
                isLoading={isLoading}
                value={metric ? format(metric.value) : '—'}
                changeNote="than before"
                {...(metric?.change === undefined ? {} : { change: metric.change })}
                {...(lowerIsBetter ? { lowerIsBetter } : {})}
              />
            ))}
          </section>
          <div className="grid gap-4 lg:grid-cols-3">
            <LineChart
              className="lg:col-span-2"
              title="Revenue and refunds"
              labelHeading="Date"
              data={data?.trend}
              series={series}
              formatValue={money}
              isLoading={isLoading}
              isFetching={isFetching}
            />
            <DonutChart
              title="Revenue by category"
              labelHeading="Category"
              valueHeading="Revenue"
              data={data?.categories}
              formatValue={money}
              isLoading={isLoading}
              isFetching={isFetching}
            />
          </div>
          <Card title="Recent orders" flush>
            <DataTable
              caption="Recent orders"
              columns={columns}
              data={data?.recent}
              getRowId={getId}
              getRowName={getName}
              isLoading={isLoading}
              isFetching={isFetching}
              searchable={false}
              columnPicker={false}
              hidePagination
              mobile="cards"
              className="p-4 pt-0"
            />
          </Card>
        </>
      )}
    </PageContainer>
  );
}
