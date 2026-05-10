"use client";

import dynamic from "next/dynamic";
import type { SwarmNode } from "../../tracker/_types";

const BeeSwarmChart = dynamic(() => import("./BeeSwarmChart"), { ssr: false });

export function BeeSwarmChartClient({ nodes, height }: { nodes: SwarmNode[]; height?: number }) {
  return <BeeSwarmChart nodes={nodes} height={height} />;
}
