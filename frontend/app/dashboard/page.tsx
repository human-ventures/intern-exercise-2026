"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchStats, type Stats } from "@/lib/api";

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
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500">Total Tasks</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total_tasks}</p>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500">Completed This Week</p>
          <p className="text-3xl font-bold text-green-600">
            {stats.completed_this_week}
          </p>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-3xl font-bold text-yellow-600">
            {stats.by_status["in_progress"] || 0}
          </p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h2 className="font-semibold text-gray-900 mb-4">By Status</h2>
          {Object.entries(stats.by_status).map(([status, count]) => (
            <div key={status} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-600 capitalize">
                {status.replace("_", " ")}
              </span>
              <span className="text-sm font-medium text-gray-900">{count}</span>
            </div>
          ))}
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <h2 className="font-semibold text-gray-900 mb-4">By Priority</h2>
          {Object.entries(stats.by_priority).map(([priority, count]) => (
            <div key={priority} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-600 capitalize">{priority}</span>
              <span className="text-sm font-medium text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Placeholder for charts — Section B asks the intern to add visual charts here */}
      <div className="mt-8 p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
        <p className="text-gray-400 text-sm">
          Charts and visual breakdowns go here (see Section B of the exercise)
        </p>
      </div>
    </main>
  );
}
