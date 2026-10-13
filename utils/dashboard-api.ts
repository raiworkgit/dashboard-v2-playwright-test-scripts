// Shapes of the Dashboard v2 API responses the tests compare the UI against.

export type WeeklyCount = { thisWeek: number; lastWeek: number; twoWeeksAgo: number; overall: number };

export type DashboardGlobal = {
  hosts: { totalHosts: WeeklyCount };
  dealers: { totalDealers: WeeklyCount };
  advertisers: { totalAdvertisers: WeeklyCount };
  licenses: { totalLicenses: WeeklyCount };
  installations: { overall: number; thisMonth: number; nextMonth: number; lastMonth: number; threeMonthsAgo: number };
  users: {
    all: WeeklyCount;
    superAdmin: WeeklyCount;
    dealerAdmin: WeeklyCount;
    dealer: WeeklyCount;
    subDealer: WeeklyCount;
  };
};

export type GrowthDownturn = { growth: number; downturn: number };
export type GraphPoint = GrowthDownturn & { month: number; week?: Record<string, GrowthDownturn> };
export type DashboardGraph = { dataPoints: GraphPoint[]; active: number };

export type RaspiModel = { model: string; count: string };

/** Summary card title → its counts in /api/dashboard/global and its `type` for /api/dashboard/graph. */
export const SUMMARY_CARDS = [
  { title: 'Total Hosts', graphType: 'hosts', counts: (g: DashboardGlobal) => g.hosts.totalHosts },
  { title: 'Total Dealers', graphType: 'dealers', counts: (g: DashboardGlobal) => g.dealers.totalDealers },
  { title: 'Total Advertisers', graphType: 'advertisers', counts: (g: DashboardGlobal) => g.advertisers.totalAdvertisers },
  { title: 'Total Licenses', graphType: 'licenses', counts: (g: DashboardGlobal) => g.licenses.totalLicenses },
] as const;

/**
 * The points the chart actually plots: weekly values when a month is selected,
 * otherwise one point per month.
 */
export function plottedPoints(graph: DashboardGraph): GrowthDownturn[] {
  return graph.dataPoints.flatMap((p) => (p.week ? Object.values(p.week) : [p]));
}

/** Legend totals: Growth is the sum of growth, Downturn the sum of downturn shown as a positive number. */
export function legendTotals(graph: DashboardGraph) {
  const points = plottedPoints(graph);
  return {
    growth: points.reduce((sum, p) => sum + p.growth, 0),
    downturn: Math.abs(points.reduce((sum, p) => sum + p.downturn, 0)),
  };
}
