"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import ChartWrapper from "./ChartWrapper";
import type { VoteBreakdownItem } from "../../tracker/_types";

interface Props {
  data: VoteBreakdownItem[];
  partyColor: string;
  mlaName: string;
  partyLineVotingPct: number;
}

export default function VoteBreakdown({
  data,
  partyColor,
  mlaName,
  partyLineVotingPct,
}: Props) {
  const csvHeaders = ["Vote", "Count"];
  const csvRows = data.map((d) => [d.label, d.count]);

  const tableData = {
    headers: csvHeaders,
    rows: csvRows.map((r) => r.map(String)),
  };

  const total = data.reduce((acc, d) => acc + d.count, 0);

  // Recharts 3: pass fill via data array rather than Cell (Cell deprecated)
  const chartData = data.map((d) => ({
    label: d.label,
    count: d.count,
    pct: total > 0 ? Math.round((d.count / total) * 100) : 0,
    fill: d.color,
  }));

  return (
    <ChartWrapper
      title="Voting record breakdown"
      subtitle={`How ${mlaName} has voted across all tracked divisions.`}
      caveat={`Party-line voting rate: ${partyLineVotingPct}%. Based on ${total} tracked votes.`}
      csvFilename={`${mlaName.toLowerCase().replace(/\s+/g, "-")}-votes`}
      csvHeaders={csvHeaders}
      csvRows={csvRows}
      tableData={tableData}
      accentColor={partyColor}
    >
      <figure
        aria-label={`Voting record breakdown for ${mlaName}`}
        style={{ margin: 0 }}
      >
        <ResponsiveContainer width="100%" height={140}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 0, right: 48, top: 4, bottom: 4 }}
          >
            <XAxis type="number" domain={[0, total]} hide />
            <YAxis
              type="category"
              dataKey="label"
              axisLine={false}
              tickLine={false}
              width={54}
              tick={{
                fill: "rgba(180,207,232,0.45)",
                fontSize: 12,
                fontFamily: "'Segoe UI', system-ui, sans-serif",
              }}
            />
            <Bar
              dataKey="count"
              radius={[0, 4, 4, 0]}
              isAnimationActive
              animationDuration={750}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.85} />
              ))}
              <LabelList
                dataKey="pct"
                position="right"
                formatter={(v: unknown) => `${v}%`}
                style={{
                  fill: "rgba(180,207,232,0.45)",
                  fontSize: 11,
                  fontFamily: "'Segoe UI', system-ui, sans-serif",
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Party-line stat */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.85rem 0 0.2rem",
          }}
        >
          <div
            style={{
              height: "4px",
              flex: 1,
              borderRadius: "2px",
              background: "rgba(180,207,232,0.06)",
              overflow: "hidden",
            }}
            role="img"
            aria-label={`Party-line voting rate: ${partyLineVotingPct}%`}
          >
            <div
              style={{
                height: "100%",
                width: `${partyLineVotingPct}%`,
                background: partyColor,
                borderRadius: "2px",
                transition: "width 0.8s ease",
              }}
            />
          </div>
          <span
            style={{
              fontSize: "0.72rem",
              color: "rgba(180,207,232,0.4)",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontWeight: 700, color: partyColor }}>
              {partyLineVotingPct}%
            </span>{" "}
            party-line
          </span>
        </div>
      </figure>
    </ChartWrapper>
  );
}
