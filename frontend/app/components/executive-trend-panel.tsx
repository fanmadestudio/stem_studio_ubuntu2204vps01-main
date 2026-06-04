"use client";

import { useState } from "react";

type TrendKey = "revenue" | "bookings" | "utilization";
type ExecutiveTrendPanelProps = {
  labels: string[];
  revenueTrend: number[];
  bookingsTrend: number[];
  utilizationTrend: number[];
};

function linePath(values: number[], width: number, height: number, padding: number): string {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const xStep = (width - padding * 2) / (values.length - 1);
  const yScale = max === min ? 1 : (height - padding * 2) / (max - min);

  return values
    .map((value, index) => {
      const x = padding + index * xStep;
      const y = height - padding - (value - min) * yScale;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

export function ExecutiveTrendPanel({ labels, revenueTrend, bookingsTrend, utilizationTrend }: ExecutiveTrendPanelProps) {
  const [activeTrend, setActiveTrend] = useState<TrendKey>("revenue");

  const trendConfig: Record<TrendKey, { title: string; series: number[]; color: string; description: string; type: "line" | "bar" }> = {
    revenue: {
      title: "Revenue Trend",
      series: revenueTrend,
      color: "var(--primary)",
      description:
        "This chart shows revenue movement over time. A consistent upward line means business value is growing and pricing/occupancy strategy is working.",
      type: "line"
    },
    bookings: {
      title: "Bookings Trend",
      series: bookingsTrend,
      color: "#2f7a52",
      description:
        "This chart tracks total bookings. Rising bars usually indicate stronger demand and better conversion from inquiries to booked studio sessions.",
      type: "bar"
    },
    utilization: {
      title: "Utilization Trend",
      series: utilizationTrend,
      color: "#5b8f70",
      description:
        "Utilization compares booked studio time versus available time. Higher values mean less idle time and stronger operational efficiency.",
      type: "line"
    }
  };

  const selectedTrend = trendConfig[activeTrend];

  return (
    <article className="card">
      <h3>2. Executive Trend Panel</h3>
      <p className="small">Last 12 months trends</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          marginTop: 10
        }}
      >
        <button className="card" type="button" onClick={() => setActiveTrend("revenue")} style={{ padding: 12, cursor: "pointer", textAlign: "left" }}>
          <p className="small">Revenue Trend</p>
          <svg viewBox="0 0 320 130" width="100%" height="130" role="img" aria-label="Revenue trend line chart">
            <rect x="0" y="0" width="320" height="130" fill="var(--surface-alt)" rx="10" />
            <path d={linePath(revenueTrend, 320, 130, 18)} fill="none" stroke="var(--primary)" strokeWidth="3" />
          </svg>
        </button>

        <button className="card" type="button" onClick={() => setActiveTrend("bookings")} style={{ padding: 12, cursor: "pointer", textAlign: "left" }}>
          <p className="small">Bookings Trend</p>
          <svg viewBox="0 0 320 130" width="100%" height="130" role="img" aria-label="Bookings trend bar chart">
            <rect x="0" y="0" width="320" height="130" fill="var(--surface-alt)" rx="10" />
            {bookingsTrend.map((value, index) => {
              const max = Math.max(...bookingsTrend);
              const barWidth = 18;
              const gap = (320 - 36 - barWidth * bookingsTrend.length) / (bookingsTrend.length - 1);
              const x = 18 + index * (barWidth + gap);
              const h = max <= 0 ? 0 : (value / max) * (130 - 38);
              const y = 130 - 18 - h;
              return <rect key={`book-bar-small-${labels[index]}`} x={x} y={y} width={barWidth} height={h} fill="#2f7a52" rx="3" />;
            })}
          </svg>
        </button>

        <button className="card" type="button" onClick={() => setActiveTrend("utilization")} style={{ padding: 12, cursor: "pointer", textAlign: "left" }}>
          <p className="small">Utilization Trend</p>
          <svg viewBox="0 0 320 130" width="100%" height="130" role="img" aria-label="Utilization trend line chart">
            <rect x="0" y="0" width="320" height="130" fill="var(--surface-alt)" rx="10" />
            <path d={linePath(utilizationTrend, 320, 130, 18)} fill="none" stroke="#5b8f70" strokeWidth="3" />
          </svg>
        </button>
      </div>
      <p className="small" style={{ marginTop: 8 }}>
        Utilization trend helps monitor how much studio time is booked vs free over time.
      </p>
      <article className="card" style={{ marginTop: 10 }}>
        <h3>{selectedTrend.title} Detail</h3>
        <p className="small">{selectedTrend.description}</p>
        <svg viewBox="0 0 760 250" width="100%" height="250" role="img" aria-label={`${selectedTrend.title} detail`}>
          <rect x="0" y="0" width="760" height="250" fill="var(--surface-alt)" rx="12" />
          {selectedTrend.type === "line" ? (
            <>
              <path d={linePath(selectedTrend.series, 760, 250, 30)} fill="none" stroke={selectedTrend.color} strokeWidth="4" />
              {selectedTrend.series.map((value, index) => {
                const x = 30 + index * ((760 - 60) / (selectedTrend.series.length - 1));
                const min = Math.min(...selectedTrend.series);
                const max = Math.max(...selectedTrend.series);
                const yScale = max === min ? 1 : (250 - 60) / (max - min);
                const y = 250 - 30 - (value - min) * yScale;
                return <circle key={`detail-point-${labels[index]}`} cx={x} cy={y} r="4" fill={selectedTrend.color} />;
              })}
            </>
          ) : (
            selectedTrend.series.map((value, index) => {
              const max = Math.max(...selectedTrend.series);
              const barWidth = 48;
              const gap = (760 - 60 - barWidth * selectedTrend.series.length) / (selectedTrend.series.length - 1);
              const x = 30 + index * (barWidth + gap);
              const h = max <= 0 ? 0 : (value / max) * (250 - 80);
              const y = 250 - 30 - h;
              return <rect key={`detail-bar-${labels[index]}`} x={x} y={y} width={barWidth} height={h} fill={selectedTrend.color} rx="6" />;
            })
          )}
          {labels.map((label, index) => {
            const x = 30 + index * ((760 - 60) / (labels.length - 1));
            return (
              <text key={`detail-label-${label}`} x={x} y={240} textAnchor="middle" fontSize="11" fill="var(--muted)">
                {label}
              </text>
            );
          })}
        </svg>
        <p className="small" style={{ marginTop: 8 }}>
          How to read: left points are older dates and right points are newer dates. Compare the overall direction to see growth, slowdown, or volatility.
        </p>
      </article>
    </article>
  );
}
