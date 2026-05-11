"use client";

import type { CSSProperties } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import ChartWrapper from "./ChartWrapper";
import type { TimelinePoint } from "../../tracker/_types";

interface Props {
  data: TimelinePoint[];
  partyColor: string;
  mlaName: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(8,14,26,0.96)",
        border: "1px solid rgba(180,207,232,0.14)",
        borderRadius: "10px",
        padding: "0.7rem 0.9rem",
        fontSize: "0.76rem",
        backdropFilter: "blur(12px)",
      }}
    >
      <p
        style={{
          color: "#b4cfe8",
          fontWeight: 700,
          marginBottom: "0.3rem",
        }}
      >
        {label}
      </p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: "rgba(180,207,232,0.55)", margin: 0 }}>
          {p.name === "contributions"
            ? `${p.value} chamber contributions`
            : `${p.value}% committee attendance`}
        </p>
      ))}
    </div>
  );
}

export default function ContributionTimeline({ data, partyColor, mlaName }: Props) {
  const csvHeaders = ["Month", "Contributions", "Delivery Score", "Committee Attendance %"];
  const csvRows = data.map((d) => [
    d.label,
    d.contributions,
    d.delivery_score,
    d.committee_attendance,
  ]);

  const tableData = {
    headers: csvHeaders,
    rows: csvRows.map((r) => r.map(String)),
  };

  return (
    <ChartWrapper
      title="Chamber contributions over time"
      subtitle="Number of debates, questions, and statements made in the Assembly chamber per month."
      caveat="Counts unique Hansard contributions. Paired absences excluded where identified."
      csvFilename={`${mlaName.toLowerCase().replace(/\s+/g, "-")}-contributions`}
      csvHeaders={csvHeaders}
      csvRows={csvRows}
      tableData={tableData}
      accentColor={partyColor}
    >
      <figure aria-label={`Chamber contributions for ${mlaName} over time`} style={{ margin: 0 }}>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={data}
            margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`fill-${partyColor.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={partyColor} stopOpacity={0.22} />
                <stop offset="95%" stopColor={partyColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(180,207,232,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "rgba(180,207,232,0.35)",
                fontSize: 11,
                fontFamily: "'Segoe UI', system-ui, sans-serif",
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "rgba(180,207,232,0.28)",
                fontSize: 10,
                fontFamily: "'Segoe UI', system-ui, sans-serif",
              }}
              width={28}
            />
            <Tooltip
              content={
                <CustomTooltip /> as unknown as React.ReactElement<
                  unknown,
                  string | React.JSXElementConstructor<unknown>
                >
              }
              cursor={{ stroke: "rgba(180,207,232,0.08)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="contributions"
              name="contributions"
              stroke={partyColor}
              strokeWidth={2}
              fill={`url(#fill-${partyColor.replace("#", "")})`}
              dot={{ fill: partyColor, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: partyColor, strokeWidth: 2, stroke: "#080e1a" }}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </figure>
    </ChartWrapper>
  );
}
