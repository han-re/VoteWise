"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";

export interface SeriesPoint {
  x: string | number;
  y: number;
}

export interface Series {
  key: string;
  /** Display name shown in the tooltip / legend. */
  label?: string;
  color: string;
  data: SeriesPoint[];
}

interface Props {
  series: Series[];
  height?: number;
  /** Format function for the y-axis ticks and tooltip values. */
  yFormatter?: (n: number) => string;
  stacked?: boolean;
  /** Optional override for the x-axis label format. */
  xFormatter?: (x: string | number) => string;
}

const GBP_COMPACT = new Intl.NumberFormat("en-GB", {
  notation: "compact",
  maximumFractionDigits: 1,
  style: "currency",
  currency: "GBP",
});

/**
 * Recharts 3 quirk: pass `fill`/`fillOpacity` per row, not via <Cell>.
 * (See § 5.6 of CODEBASE_KNOWLEDGE.md and the existing results-page pattern.)
 *
 * We fold every series into a single `chartData` array keyed by `x`, with
 * one column per series. Recharts then stacks/aligns them by the shared
 * x-axis. Each <Area> still gets its own `fill`/`fillOpacity` props.
 */
export function TimeSeriesChart({
  series,
  height = 260,
  yFormatter,
  stacked = true,
  xFormatter,
}: Props) {
  const chartData = useMemo(() => {
    const keys = new Set<string | number>();
    for (const s of series) {
      for (const p of s.data) keys.add(p.x);
    }
    const sorted = [...keys].sort();
    return sorted.map((x) => {
      const row: Record<string, number | string> = { x };
      for (const s of series) {
        const point = s.data.find((p) => p.x === x);
        row[s.key] = point ? point.y : 0;
      }
      return row;
    });
  }, [series]);

  const formatY = yFormatter ?? ((n: number) => GBP_COMPACT.format(n));
  const formatX = xFormatter ?? ((x: string | number) => String(x));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={chartData}
        margin={{ top: 8, right: 12, bottom: 4, left: 4 }}
      >
        <CartesianGrid stroke="var(--vw-pro-grid)" strokeDasharray="2 4" />
        <XAxis
          dataKey="x"
          stroke="rgba(180,207,232,0.5)"
          tick={{ fill: "rgba(180,207,232,0.6)", fontSize: 11 }}
          tickFormatter={formatX}
          axisLine={{ stroke: "var(--vw-pro-grid)" }}
          tickLine={{ stroke: "var(--vw-pro-grid)" }}
        />
        <YAxis
          stroke="rgba(180,207,232,0.5)"
          tick={{ fill: "rgba(180,207,232,0.6)", fontSize: 11 }}
          tickFormatter={(v) => formatY(Number(v))}
          axisLine={{ stroke: "var(--vw-pro-grid)" }}
          tickLine={{ stroke: "var(--vw-pro-grid)" }}
          width={64}
        />
        <Tooltip
          contentStyle={{
            background: "var(--vw-pro-surface)",
            border: "1px solid var(--vw-pro-grid)",
            borderRadius: 6,
            fontSize: 12,
            color: "#cddcec",
          }}
          itemStyle={{ color: "#cddcec" }}
          labelStyle={{ color: "rgba(180,207,232,0.6)", marginBottom: 4 }}
          formatter={(v, name) => [formatY(Number(v)), String(name)]}
          labelFormatter={(x) => formatX(x as string | number)}
        />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label ?? s.key}
            stroke={s.color}
            fill={s.color}
            fillOpacity={0.25}
            stackId={stacked ? "vw-stack" : undefined}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
