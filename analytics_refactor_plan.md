# Analytics Refactor Plan

1. **Rewrite Aggregation Tools**
   - `analyzeTrafficOverview`: Use SQL to aggregate sessions, visitors, pageviews, bounce rate, duration. Return per-day rows and summary metrics. Include `sql_query`/`sql_params`.
   - `compareTrafficSources`: JOIN sessions + transactions to compute quality score per source via SQL.
   - `analyzeConversionFunnel`: Count sessions per funnel step using SQL; calculate drop-off/conversion in TS.
   - `identifyTopLandingPages`: Aggregate pageviews by page; produce top/bottom lists in SQL.
   - `analyzeDevicePerformance`: Join sessions with visitor properties; aggregate by device/browser in SQL.
   - `detectTrafficAnomalies`: Pull daily sessions; compute anomalies (z-score) in TS; include bot stats query.
   - `analyzeUserBehavior`: Aggregate visitors/sessions to compute new vs returning, frequency, engagement.

2. **Update `getAnalyticsData`**
   - Already returning `rows` + SQL metadata; ensure error paths populate `sql_query/sql_params`.

3. **UI Adjustments**
   - Components under `src/components/tools/web-analytics` consume updated fields (rows, metrics, sql info).
   - Update types in `src/components/nexus/RespostaDaIA.tsx` for each tool (rows, metrics, sql metadata).

4. **Validation**
   - Run `npm run lint`/`npm run build` to catch type issues.
   - Spot-check each tool via `/nexus` UI.

