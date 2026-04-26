"use client";

import { useEffect, useMemo, useState } from "react";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { MerchantShell } from "@/components/dashboard/merchant-shell";
import { MetricCard } from "@/components/dashboard/metric-card";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { useBusinessSession } from "@/store/business-session-provider";
import { Card } from "@/components/ui/card";
import { merchantApi } from "@/lib/merchant-api";
import type { MerchantDashboardOverview } from "@/lib/types";

export default function DashboardPage() {
  const { session } = useBusinessSession();
  const [days, setDays] = useState(7);
  const [overview, setOverview] = useState<MerchantDashboardOverview | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOverview() {
      if (!session?.token) {
        return;
      }

      const response = await merchantApi.getDashboardOverview(
        session.token,
        days,
      );
      if (response.statusCode !== 200) {
        setError(response.message);
        return;
      }

      setOverview(response.data);
      setError(null);
    }

    void loadOverview();
  }, [days, session?.token]);

  const chartData = useMemo(() => {
    const monthLabels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const trend = overview?.revenueTrend || [];
    if (trend.length) {
      return monthLabels.map((label, index) => {
        const source = trend[index % trend.length];
        return {
          label,
          primary: Number(source?.net || 0),
          secondary: Number(source?.gross || 0),
        };
      });
    }

    if (!overview?.recentActivity?.length) {
      return [
        { label: "Jan", primary: 34, secondary: 58 },
        { label: "Feb", primary: 46, secondary: 74 },
        { label: "Mar", primary: 26, secondary: 48 },
        { label: "Apr", primary: 39, secondary: 62 },
        { label: "May", primary: 26, secondary: 44 },
        { label: "Jun", primary: 44, secondary: 70 },
        { label: "Jul", primary: 34, secondary: 58 },
        { label: "Aug", primary: 39, secondary: 62 },
        { label: "Sep", primary: 34, secondary: 58 },
        { label: "Oct", primary: 42, secondary: 66 },
        { label: "Nov", primary: 46, secondary: 74 },
        { label: "Dec", primary: 31, secondary: 54 },
      ];
    }

    return monthLabels.map((label, index) => {
      const item = overview.recentActivity[index % overview.recentActivity.length];
      return {
      label,
      primary:
        item.status === "success"
          ? Number(item.amount || 0)
          : Number(item.amount || 0) / 2,
      secondary:
        item.status === "pending"
          ? Number(item.amount || 0)
          : Number(item.amount || 0) / 4,
      };
    });
  }, [overview]);

  return (
    <MerchantShell
      title="Overview"
      actions={
        <div className="flex flex-wrap items-center gap-3">
          {[
            { label: "Last 30 Days", value: 30 },
            { label: "Quarterly", value: 90 },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDays(option.value)}
              className={`h-10 rounded-[8px] px-5 text-sm font-bold ${
                days === option.value
                  ? "bg-[#e8f8ee] text-[#00884f]"
                  : "bg-white text-[#667085]"
              }`}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            className="dashboard-black-button h-10 rounded-[10px] px-8 text-sm font-bold"
          >
            Export
          </button>
        </div>
      }
    >
      {error ? (
        <p className="mb-6 rounded-[10px] bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-4">
        <MetricCard
          label="Total Revenue"
          value={overview?.metrics.totalVolume || 0}
          kind="currency"
        />
        <MetricCard
          label="Successful Payments"
          value={overview?.metrics.successfulPayments || overview?.metrics.statusBreakdown.success || 0}
        />
        <MetricCard
          label="Failed Transactions"
          value={overview?.metrics.failedTransactions || overview?.metrics.statusBreakdown.failed || 0}
        />
        <MetricCard
          label="Avg. Conversion"
          value={`${overview?.metrics.conversionRate || 0}%`}
        />
      </div>

      <div className="mt-10">
        <ActivityChart data={chartData} />
      </div>

      <Card className="mt-10 overflow-hidden p-5">
        <div className="mb-8 flex items-center justify-between gap-4">
          <p className="text-[18px] font-bold text-slate-950">
            Recent Activity
          </p>
          <button type="button" className="text-sm font-bold text-[#00884f]">
            View All
          </button>
        </div>
        <TransactionsTable
          transactions={overview?.recentActivity || []}
          emptyMessage="No recent merchant activity yet."
        />
      </Card>
    </MerchantShell>
  );
}
