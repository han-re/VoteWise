"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { SwarmNode } from "../../tracker/_types";

interface Props {
  nodes: SwarmNode[];
  height?: number;
}

const RADIUS = 8;
const PADDING = 2;

export default function BeeSwarmChart({ nodes, height = 220 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const tooltip = tooltipRef.current;
    if (!svg || !tooltip || nodes.length === 0) return;

    const width = svg.clientWidth || 800;
    const cx = height / 2;

    const xScale = d3
      .scaleLinear()
      .domain([0, 100])
      .range([RADIUS + 8, width - RADIUS - 8]);

    // D3 force simulation — beeswarm on x-axis
    const simNodes = nodes.map((n) => ({ ...n, x: xScale(n.score), y: cx }));

    const sim = d3
      .forceSimulation(simNodes)
      .force("x", d3.forceX((d: (typeof simNodes)[0]) => xScale(d.score)).strength(0.9))
      .force("y", d3.forceY(cx).strength(0.12))
      .force("collide", d3.forceCollide(RADIUS + PADDING))
      .stop();

    // Run offline
    for (let i = 0; i < 200; i++) sim.tick();

    // Clear previous
    d3.select(svg).selectAll("*").remove();

    const g = d3.select(svg).append("g");

    // X-axis ticks
    const axisTicks = [0, 25, 50, 75, 100];
    g.selectAll(".tick-line")
      .data(axisTicks)
      .join("line")
      .attr("class", "tick-line")
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "rgba(180,207,232,0.06)")
      .attr("stroke-dasharray", "3,4");

    g.selectAll(".tick-label")
      .data(axisTicks)
      .join("text")
      .attr("class", "tick-label")
      .attr("x", (d) => xScale(d))
      .attr("y", height - 4)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(180,207,232,0.22)")
      .attr("font-size", 9)
      .text((d) => d);

    // Node groups
    const nodeG = g
      .selectAll(".node")
      .data(simNodes)
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer")
      .on("mouseenter", function (_event, d) {
        d3.select(this).select("circle").attr("r", RADIUS + 3);
        tooltip.style.display = "block";
        tooltip.style.opacity = "1";
        tooltip.innerHTML = `
          <span style="font-size:0.6rem;color:${d.party_color};font-weight:700;text-transform:uppercase;letter-spacing:0.08em">${d.party_name}</span><br/>
          <span style="font-size:0.82rem;font-weight:700;color:#b4cfe8">${d.name}</span><br/>
          <span style="font-size:0.65rem;color:rgba(180,207,232,0.45)">${d.constituency}</span><br/>
          <span style="font-size:0.75rem;color:${d.party_color};font-weight:700;margin-top:0.3rem;display:inline-block">${d.score}<span style="font-size:0.5rem;color:rgba(180,207,232,0.3)"> / 100</span></span>
        `;
      })
      .on("mousemove", function (event) {
        const [mx, my] = d3.pointer(event, svg.parentElement!);
        tooltip.style.left = `${mx + 14}px`;
        tooltip.style.top = `${my - 10}px`;
      })
      .on("mouseleave", function () {
        d3.select(this).select("circle").attr("r", RADIUS);
        tooltip.style.opacity = "0";
        tooltip.style.display = "none";
      })
      .on("click", (_, d) => {
        window.location.href = `/tracker/mla/${d.id}`;
      });

    nodeG
      .append("circle")
      .attr("r", RADIUS)
      .attr("fill", (d) => `${d.party_color}33`)
      .attr("stroke", (d) => d.party_color)
      .attr("stroke-width", 1.5)
      .style("transition", "r 0.15s ease");

    nodeG
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", 6)
      .attr("font-weight", 700)
      .attr("fill", (d) => d.party_color)
      .text((d) => String(d.score));

    return () => { sim.stop(); };
  }, [nodes, height]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        aria-label="Pledge delivery score bee swarm chart"
        role="img"
      />
      <div
        ref={tooltipRef}
        style={{
          position: "absolute",
          display: "none",
          opacity: 0,
          pointerEvents: "none",
          background: "rgba(8,14,26,0.96)",
          border: "1px solid rgba(180,207,232,0.14)",
          borderRadius: "10px",
          padding: "0.65rem 0.85rem",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          zIndex: 20,
          transition: "opacity 0.12s",
          lineHeight: 1.5,
          maxWidth: "200px",
        }}
      />
    </div>
  );
}
