"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchStats, type Stats } from "@/lib/api";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  todo: "#9ca3af",
  in_progress: "#f59e0b",
  done: "#22c55e",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#6ee7b7",
  medium: "#60a5fa",
  high: "#fb923c",
  urgent: "#f87171",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

function CustomPieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
}) {
  if (percent === 0) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-white shadow-lg border border-gray-200 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: item.payload.fill }}
        />
        <span className="text-sm font-medium text-gray-900">{item.name}</span>
      </div>
      <p className="text-sm text-gray-600 mt-0.5">
        {item.value} task{item.value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-gray-500">Loading dashboard...</p>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-red-500">Failed to load stats.</p>
      </main>
    );
  }

  const statusData = Object.entries(stats.by_status).map(([key, value]) => ({
    name: STATUS_LABELS[key] || key,
    value,
    fill: STATUS_COLORS[key] || "#d1d5db",
  }));

  const priorityData = Object.entries(stats.by_priority).map(
    ([key, value]) => ({
      name: PRIORITY_LABELS[key] || key,
      value,
      fill: PRIORITY_COLORS[key] || "#d1d5db",
    })
  );

  const doneCount = stats.by_status["done"] || 0;
  const completionPct =
    stats.total_tasks > 0 ? Math.round((doneCount / stats.total_tasks) * 100) : 0;
  const completionData = [
    { name: "Completed", value: completionPct, fill: "#22c55e" },
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of task statistics</p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back to Tasks
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="p-5 border border-gray-200 rounded-xl bg-gradient-to-br from-white to-gray-50">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Total Tasks
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.total_tasks}
          </p>
        </div>
        <div className="p-5 border border-gray-200 rounded-xl bg-gradient-to-br from-green-50 to-white">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Completed
          </p>
          <p className="text-3xl font-bold text-green-600 mt-1">{doneCount}</p>
        </div>
        <div className="p-5 border border-gray-200 rounded-xl bg-gradient-to-br from-yellow-50 to-white">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            In Progress
          </p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">
            {stats.by_status["in_progress"] || 0}
          </p>
        </div>
        <div className="p-5 border border-gray-200 rounded-xl bg-gradient-to-br from-blue-50 to-white">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            This Week
          </p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            {stats.completed_this_week}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Status Donut Chart */}
        <div className="p-5 border border-gray-200 rounded-xl">
          <h2 className="font-semibold text-gray-900 mb-2">Task Status</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={CustomPieLabel}
                strokeWidth={0}
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs text-gray-600">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Bar Chart */}
        <div className="p-5 border border-gray-200 rounded-xl">
          <h2 className="font-semibold text-gray-900 mb-2">By Priority</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={priorityData}
              margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                {priorityData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Completion Radial */}
        <div className="p-5 border border-gray-200 rounded-xl flex flex-col items-center">
          <h2 className="font-semibold text-gray-900 mb-2 self-start">
            Completion Rate
          </h2>
          <div className="relative">
            <ResponsiveContainer width={200} height={200}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="70%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                data={completionData}
                barSize={16}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                  background={{ fill: "#f3f4f6" }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {completionPct}%
                </p>
                <p className="text-xs text-gray-500">done</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Tables */}
      <div className="grid grid-cols-2 gap-6">
        <div className="p-5 border border-gray-200 rounded-xl">
          <h2 className="font-semibold text-gray-900 mb-4">Status Breakdown</h2>
          {Object.entries(stats.by_status).map(([status, count]) => {
            const pct =
              stats.total_tasks > 0
                ? Math.round((count / stats.total_tasks) * 100)
                : 0;
            return (
              <div key={status} className="mb-3 last:mb-0">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">
                    {STATUS_LABELS[status] || status}
                  </span>
                  <span className="font-medium text-gray-900">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: STATUS_COLORS[status] || "#d1d5db",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-5 border border-gray-200 rounded-xl">
          <h2 className="font-semibold text-gray-900 mb-4">
            Priority Breakdown
          </h2>
          {Object.entries(stats.by_priority).map(([priority, count]) => {
            const pct =
              stats.total_tasks > 0
                ? Math.round((count / stats.total_tasks) * 100)
                : 0;
            return (
              <div key={priority} className="mb-3 last:mb-0">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">
                    {PRIORITY_LABELS[priority] || priority}
                  </span>
                  <span className="font-medium text-gray-900">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: PRIORITY_COLORS[priority] || "#d1d5db",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
