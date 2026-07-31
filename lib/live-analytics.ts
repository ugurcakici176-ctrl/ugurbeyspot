export interface AnalyticsTrendPoint {
  date: string;
  visitors: number;
  pageViews: number;
}

export interface AnalyticsPathStat {
  path: string;
  views: number;
}

export interface LiveAnalyticsSummary {
  activeNow: number;
  todayVisitors: number;
  todayPageViews: number;
  lastUpdatedAt: string;
  trend: AnalyticsTrendPoint[];
  topPaths: AnalyticsPathStat[];
}

