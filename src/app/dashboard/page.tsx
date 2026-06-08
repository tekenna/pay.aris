"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiAlertCircle,
  FiArrowUpRight,
  FiBarChart2,
  FiCheckCircle,
  FiCreditCard,
  FiSearch,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";
import { MerchantShell } from "@/components/dashboard/merchant-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Filter, type FilterItem } from "@/components/ui/Filter";
import type {
  BusinessTransaction,
  MerchantDashboardOverview,
} from "@/lib/types";
import {
  cn,
  downloadCsvFile,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  getInitials,
} from "@/lib/utils";
import { useBusinessSession } from "@/store/business-session-provider";
import { dashboardService } from "@/services/dashboard.service";

type PeriodOption = {
  label: string;
  value: number;
  summaryLabel: string;
};

type BankSeries = {
  name: string;
  success: number;
  failed: number;
  volume: number;
};

type SourcePerformance = {
  source: string;
  label: string;
  successRate: number;
  volume: number;
  grossVolume: number;
  checkoutSessions: number;
  successfulPayments: number;
  pendingSessions: number;
  failedSessions: number;
  icon: string;
  color: string;
  accent: string;
};

type RankedBank = {
  name: string;
  value: number;
};

type ErrorItem = {
  label: string;
  count: number;
};

type SourceFilter = "all" | string;

type PerformanceRow = {
  bank: string;
  code: string;
  successRate: number;
  pendingRate: number;
  failedRate: number;
  totalVolume: number;
  health: "strong" | "steady" | "watch";
};

const periodOptions: PeriodOption[] = [
  { label: "Day", value: 1, summaryLabel: "today" },
  { label: "Week", value: 7, summaryLabel: "this week" },
  { label: "Month", value: 30, summaryLabel: "this month" },
];

function buildBankSeries(overview: MerchantDashboardOverview | null) {
  return (overview?.bankPerformance || [])
    .map((item) => ({
      name: item.bankName,
      success: item.successfulPayments,
      failed: item.failedSessions,
      volume: item.totalVolume,
    }))
    .sort((left, right) => right.volume - left.volume)
    .slice(0, 9);
}

function buildSourcePerformance(overview: MerchantDashboardOverview | null) {
  return (overview?.sourcePerformance || []).map((item, index) => ({
    source: item.source,
    label: item.label,
    successRate: item.successRate,
    volume: item.volume,
    grossVolume: item.grossVolume,
    checkoutSessions: item.checkoutSessions,
    successfulPayments: item.successfulPayments,
    pendingSessions: item.pendingSessions,
    failedSessions: item.failedSessions,
    icon: item.source === "api_checkout" ? "API" : "PL",
    color: index % 2 === 0 ? "#2596be" : "#007074",
    accent: index % 2 === 0 ? "#e7f5fa" : "#dff1f4",
  }));
}

function buildErrors(overview: MerchantDashboardOverview | null) {
  return overview?.issueBreakdown || [];
}

function buildPerformanceRows(overview: MerchantDashboardOverview | null) {
  return (overview?.bankPerformance || []).map((bank) => {
    const base = Number(bank.successRate || 0);
    return {
      bank: bank.bankName,
      code: getInitials(bank.bankName),
      successRate: bank.successRate,
      pendingRate: bank.pendingRate,
      failedRate: bank.failedRate,
      totalVolume: bank.totalVolume,
      health: base >= 78 ? "strong" : base >= 60 ? "steady" : "watch",
    } as PerformanceRow;
  });
}

function DashboardStatCard({
  label,
  value,
  note,
  tone,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  tone: "violet" | "blue" | "green" | "rose";
  icon: React.ReactNode;
}) {
  const palette = {
    violet: {
      chip: "bg-[var(--brand-soft)] text-[var(--brand)]",
      dot: "bg-[var(--brand)]",
    },
    blue: {
      chip: "bg-[#edf2f7] text-[var(--brand-ink)]",
      dot: "bg-[var(--brand-ink)]",
    },
    green: {
      chip: "bg-[var(--brand-soft)] text-[var(--brand)]",
      dot: "bg-[var(--brand)]",
    },
    rose: {
      chip: "bg-[#fff0f1] text-[#e45865]",
      dot: "bg-[#e45865]",
    },
  }[tone];

  return (
    <Card className="bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-[8px]",
          palette.chip,
        )}
      >
        {icon}
      </div>
      <p className="mt-5 text-[12px] font-medium uppercase tracking-[0.08em] text-[#98a2b3]">
        {label}
      </p>
      <p className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#101828]">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2 text-[12px] text-[#667085]">
        <span className={cn("h-2 w-2 rounded-full", palette.dot)} />
        <span>{note}</span>
      </div>
    </Card>
  );
}

function GroupedBankChart({
  banks,
  onOpenTransactions,
  onBankSelect,
}: {
  banks: BankSeries[];
  onOpenTransactions: () => void;
  onBankSelect: (bankName: string) => void;
}) {
  const max = Math.max(
    ...banks.map((item) => Math.max(item.success, item.failed)),
    1,
  );
  const gridSteps = 5;

  return (
    <Card className="overflow-hidden bg-white p-5 shadow-[0_24px_55px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[18px] font-semibold tracking-[-0.02em] text-[#111827]">
            Bank reports
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px] text-[#667085]">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)]" />
              Successful
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#cfd6e4]" />
              Failed
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenTransactions}
          className="inline-flex h-10 items-center justify-center rounded-[6px] bg-[var(--brand-panel)] px-5 text-[13px] font-medium text-white"
        >
          Transactions
        </button>
      </div>

      {banks.length ? (
        <div className="mt-8 overflow-x-auto">
          <div className="grid min-w-[780px] grid-cols-[52px_repeat(9,minmax(0,1fr))] gap-x-4">
            <div className="relative h-[320px]">
              {Array.from({ length: gridSteps + 1 }).map((_, index) => {
                const value = Math.round(
                  (max * (gridSteps - index)) / gridSteps,
                );
                return (
                  <div
                    key={index}
                    className="absolute left-0 right-0 flex items-center"
                    style={{ top: `${(index / gridSteps) * 100}%` }}
                  >
                    <span className="-translate-y-1/2 text-[11px] text-[#98a2b3]">
                      {value === 0 ? "0" : `${Math.round(value / 1000)}k`}
                    </span>
                  </div>
                );
              })}
            </div>

            {banks.map((bank) => (
              <div
                key={bank.name}
                className="relative flex flex-col justify-end"
              >
                <div className="relative h-[320px] border-b border-[#edf1f5]">
                  {Array.from({ length: gridSteps + 1 }).map((_, index) => (
                    <div
                      key={index}
                      className="absolute left-0 right-0 border-t border-dashed border-[#edf1f5]"
                      style={{ top: `${(index / gridSteps) * 100}%` }}
                    />
                  ))}

                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-2">
                    <div
                      role="button"
                      tabIndex={0}
                      className="w-5 rounded-t-[6px] bg-[var(--brand)] shadow-[0_12px_24px_rgba(37,150,190,0.18)]"
                      style={{
                        height: `${Math.max(24, (bank.success / max) * 250)}px`,
                      }}
                      title={`${bank.name} successful`}
                      onClick={() => onBankSelect(bank.name)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onBankSelect(bank.name);
                        }
                      }}
                    />
                    <div
                      role="button"
                      tabIndex={0}
                      className="w-5 rounded-t-[6px] bg-[#cfd6e4]"
                      style={{
                        height: `${Math.max(16, (bank.failed / max) * 250)}px`,
                      }}
                      title={`${bank.name} failed`}
                      onClick={() => onBankSelect(bank.name)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onBankSelect(bank.name);
                        }
                      }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onBankSelect(bank.name)}
                  className="pt-4 text-center"
                >
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-[6px] bg-[var(--brand-soft)] text-[11px] font-semibold text-[var(--brand)]">
                    {getInitials(bank.name)}
                  </div>
                  <p className="mt-2 truncate text-[12px] font-medium text-[#344054]">
                    {bank.name}
                  </p>
                  <p className="mt-1 text-[11px] text-[#98a2b3]">
                    {formatNumber(Math.round(bank.volume / 1000))}k
                  </p>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-[8px] border border-dashed border-[#dbe3ec] px-4 py-10 text-center">
          <p className="text-[14px] font-medium text-[#667085]">
            No bank report activity yet.
          </p>
          <p className="mt-2 text-[12px] text-[#98a2b3]">
            Once Aris Pay starts receiving checkout transactions, bank-level
            performance will appear here.
          </p>
        </div>
      )}
    </Card>
  );
}

function ProgressRing({
  value,
  color,
  track,
}: {
  value: number;
  color: string;
  track: string;
}) {
  const normalized = Math.max(0, Math.min(100, value));
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <svg viewBox="0 0 88 88" className="h-[92px] w-[92px]">
      <circle
        cx="44"
        cy="44"
        r={radius}
        fill="none"
        stroke={track}
        strokeWidth="8"
      />
      <circle
        cx="44"
        cy="44"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 44 44)"
      />
      <text
        x="44"
        y="40"
        textAnchor="middle"
        className="fill-[#101828] text-[14px] font-semibold"
      >
        {normalized}%
      </text>
      <text
        x="44"
        y="54"
        textAnchor="middle"
        className="fill-[#98a2b3] text-[8px] font-medium uppercase"
      >
        success
      </text>
    </svg>
  );
}

function SourcePerformancePanel({
  items,
  sourceFilter,
  onSourceFilterChange,
}: {
  items: SourcePerformance[];
  sourceFilter: SourceFilter;
  onSourceFilterChange: (value: SourceFilter) => void;
}) {
  const sourceOptions = [
    { label: "All sources", value: "all" },
    ...items.map((item) => ({
      label: item.label,
      value: item.source,
    })),
  ];
  const filterItems: FilterItem[] = [
    {
      title: "Source",
      type: "checkbox",
      selectionMode: "single",
      values: sourceOptions,
      selected: sourceFilter === "all" ? [] : [sourceFilter],
    },
  ];

  return (
    <Card className="bg-white p-5 shadow-[0_24px_55px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-[17px] font-semibold tracking-[-0.02em] text-[#111827]">
          Collection performance by source
        </p>
        <Filter
          filterItems={filterItems}
          onChange={(nextItems) => {
            const nextValue = nextItems[0]?.selected?.[0] ?? "all";
            onSourceFilterChange(nextValue as SourceFilter);
          }}
        />
      </div>

      {items.length ? (
        <div className="grid gap-4">
          {items.map((item) => (
            <div
              key={item.label}
              className="grid gap-5 rounded-[8px] border border-[#edf1f5] bg-[#fbfcfd] p-4 sm:grid-cols-[120px_1fr] sm:items-center"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-[8px] text-[13px] font-semibold text-white"
                  style={{ backgroundColor: item.color }}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#111827]">
                    {item.label}
                  </p>
                  <p className="text-[12px] text-[#98a2b3]">Card rail</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <ProgressRing
                    value={item.successRate}
                    color={item.color}
                    track={item.accent}
                  />
                  <div>
                    <p className="text-[12px] uppercase tracking-[0.08em] text-[#98a2b3]">
                      Processed volume
                    </p>
                    <p className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-[#111827]">
                      {formatCurrency(item.volume)}
                    </p>
                    <p className="mt-1 text-[12px] text-[#98a2b3]">
                      {formatCurrency(item.grossVolume)} requested
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 text-[12px] text-[#667085]">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.successfulPayments} successful payments
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#d6deea]" />
                    {item.pendingSessions} pending, {item.failedSessions} failed
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#f3f5f8]" />
                    {item.checkoutSessions} checkout sessions
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[8px] border border-dashed border-[#dbe3ec] px-4 py-10 text-center">
          <p className="text-[14px] font-medium text-[#667085]">
            No source performance data yet.
          </p>
          <p className="mt-2 text-[12px] text-[#98a2b3]">
            Once checkout sessions start coming in, Aris Pay will show how
            payment links and API checkouts are performing here.
          </p>
        </div>
      )}
    </Card>
  );
}

function RankedList({
  title,
  icon,
  items,
  tone,
}: {
  title: string;
  icon: React.ReactNode;
  items: RankedBank[];
  tone: "success" | "danger";
}) {
  const palette =
    tone === "success"
      ? "bg-[var(--brand-soft)] text-[var(--brand)]"
      : "bg-[#fff1f2] text-[#e45865]";

  return (
    <Card className="bg-white p-5 shadow-[0_24px_55px_rgba(15,23,42,0.06)]">
      <div className="mb-5 flex items-center gap-3">
        <span
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-[8px]",
            palette,
          )}
        >
          {icon}
        </span>
        <p className="text-[15px] font-semibold text-[#111827]">{title}</p>
      </div>

      {items.length ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-[6px] bg-[#f5f7fb] px-4 py-3"
            >
              <span className="text-[13px] font-medium text-[#344054]">
                {item.name}
              </span>
              <span className="text-[12px] font-semibold text-[#111827]">
                {formatNumber(item.value / 1000)}k
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[8px] border border-dashed border-[#dbe3ec] px-4 py-10 text-center">
          <p className="text-[14px] font-medium text-[#667085]">
            No bank ranking available yet.
          </p>
          <p className="mt-2 text-[12px] text-[#98a2b3]">
            This list will populate when Aris Pay records enough settled
            transactions to compare bank performance.
          </p>
        </div>
      )}
    </Card>
  );
}

function ErrorList({
  items,
  periodLabel,
}: {
  items: ErrorItem[];
  periodLabel: string;
}) {
  return (
    <Card className="bg-white p-5 shadow-[0_24px_55px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-[17px] font-semibold tracking-[-0.02em] text-[#111827]">
          Top failed checkout reasons
        </p>
        <span className="inline-flex h-10 items-center rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[12px] font-medium text-[#667085]">
          {periodLabel}
        </span>
      </div>

      {items.length ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-[6px] bg-[#f6f7fb] px-4 py-3"
            >
              <span className="max-w-[75%] truncate text-[13px] text-[#475467]">
                {item.label}
              </span>
              <span className="text-[12px] font-semibold text-[#111827]">
                {formatNumber(item.count)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[8px] border border-dashed border-[#dbe3ec] px-4 py-10 text-center">
          <p className="text-[14px] font-medium text-[#667085]">
            No failed checkout reasons recorded.
          </p>
          <p className="mt-2 text-[12px] text-[#98a2b3]">
            When expired or failed checkout sessions are logged, the most common
            reasons will appear here.
          </p>
        </div>
      )}
    </Card>
  );
}

function PerformanceTable({
  rows,
  search,
  onSearchChange,
}: {
  rows: PerformanceRow[];
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const filteredRows = rows.filter((row) =>
    row.bank.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Card className="overflow-hidden bg-white p-5 shadow-[0_24px_55px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="mb-6">
        <p className="text-[17px] font-semibold tracking-[-0.02em] text-[#111827]">
          Bank settlement performance
        </p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full max-w-[320px]">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by bank name"
              className="h-10 w-full rounded-[6px] border border-[#e4e7ec] bg-white pl-10 pr-4 text-[13px] text-[#344054] outline-none placeholder:text-[#98a2b3]"
            />
          </label>

          <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#667085]">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)]" />
              Healthy rail
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
              Watchlist
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#e45865]" />
              Low rail
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-[12px] uppercase tracking-[0.08em] text-[#98a2b3]">
              <th className="rounded-l-[6px] bg-[#f5f7fb] px-4 py-3 font-medium">
                Bank name
              </th>
              <th className="bg-[#f5f7fb] px-4 py-3 font-medium">Success</th>
              <th className="bg-[#f5f7fb] px-4 py-3 font-medium">Pending</th>
              <th className="bg-[#f5f7fb] px-4 py-3 font-medium">Failed</th>
              <th className="bg-[#f5f7fb] px-4 py-3 font-medium">Volume</th>
              <th className="rounded-r-[6px] bg-[#f5f7fb] px-4 py-3 font-medium">
                Health
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length ? (
              filteredRows.map((row) => (
                <tr key={row.bank} className="text-[14px] text-[#111827]">
                  <td className="rounded-l-[6px] bg-white px-4 py-3 shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-[var(--brand-soft)] text-[11px] font-semibold text-[var(--brand)]">
                        {row.code}
                      </span>
                      <span className="font-medium text-[#344054]">
                        {row.bank}
                      </span>
                    </div>
                  </td>
                  <td className="bg-white px-4 py-3 text-[#344054] shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
                    {row.successRate}%
                  </td>
                  <td className="bg-white px-4 py-3 text-[#344054] shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
                    {row.pendingRate}%
                  </td>
                  <td className="bg-white px-4 py-3 text-[#344054] shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
                    {row.failedRate}%
                  </td>
                  <td className="bg-white px-4 py-3 text-[#344054] shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
                    {formatCurrency(row.totalVolume)}
                  </td>
                  <td className="rounded-r-[6px] bg-white px-4 py-3 shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
                    <span
                      className={cn(
                        "inline-flex rounded-[6px] px-3 py-1 text-[12px] font-medium",
                        row.health === "strong" &&
                          "bg-[var(--brand-soft)] text-[var(--brand)]",
                        row.health === "steady" &&
                          "bg-[#fff6e7] text-[#c27b13]",
                        row.health === "watch" && "bg-[#fff0f1] text-[#e45865]",
                      )}
                    >
                      {row.health === "strong"
                        ? "Healthy"
                        : row.health === "steady"
                          ? "Watch"
                          : "Low"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="rounded-[8px] border border-dashed border-[#dbe3ec] bg-white px-4 py-10 text-center"
                >
                  <p className="text-[14px] font-medium text-[#667085]">
                    No bank settlement performance data yet.
                  </p>
                  <p className="mt-2 text-[12px] text-[#98a2b3]">
                    Once checkout sessions begin settling into merchant
                    accounts, this table will show bank-level success, pending,
                    and failed rates.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function RecentTransactionsPanel({
  transactions,
  onViewAll,
}: {
  transactions: BusinessTransaction[];
  onViewAll: () => void;
}) {
  const rows = transactions.slice(0, 5);

  return (
    <Card className="bg-white p-5 shadow-[0_24px_55px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[17px] font-semibold tracking-[-0.02em] text-[#111827]">
          Latest transaction flow
        </p>
        <button
          type="button"
          onClick={onViewAll}
          className="text-[12px] font-medium text-[#98a2b3] transition hover:text-[#344054]"
        >
          View all transactions
        </button>
      </div>

      <div className="grid gap-3">
        {rows.length ? (
          rows.map((item) => {
            const success = String(item.status).toLowerCase() === "success";
            return (
              <div
                key={item._id}
                className="flex flex-col gap-3 rounded-[8px] border border-[#edf1f5] bg-[#fbfcfd] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-[8px]",
                      success
                        ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                        : "bg-[#fff0f1] text-[#e45865]",
                    )}
                  >
                    {success ? (
                      <FiCheckCircle className="h-4 w-4" />
                    ) : (
                      <FiAlertCircle className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <p className="text-[14px] font-medium text-[#111827]">
                      {item.customer?.name || item.narration || item.reference}
                    </p>
                    <p className="mt-1 text-[12px] text-[#98a2b3]">
                      {item.channel || item.paymentMethod || "bank transfer"} •{" "}
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-semibold text-[#111827]">
                    {formatCurrency(item.amount, item.currency || "NGN")}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-[12px] font-medium capitalize",
                      success ? "text-[var(--brand)]" : "text-[#e45865]",
                    )}
                  >
                    {item.status}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[8px] border border-dashed border-[#dbe3ec] px-4 py-8 text-center text-[14px] text-[#98a2b3]">
            No recent merchant activity yet.
          </div>
        )}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { session } = useBusinessSession();
  const [days, setDays] = useState(7);
  const [overview, setOverview] = useState<MerchantDashboardOverview | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadOverview() {
      if (!session?.token) {
        return;
      }

      setIsLoading(true);
      const response = await dashboardService.getOverview(
        session.token,
        days,
      );
      if (response.statusCode !== 200) {
        setError(response.message);
        setIsLoading(false);
        return;
      }

      setOverview(response.data);
      setError(null);
      setIsLoading(false);
    }

    void loadOverview();
  }, [days, session?.token]);

  const selectedPeriod =
    periodOptions.find((option) => option.value === days) || periodOptions[1];

  const bankSeries = useMemo(() => buildBankSeries(overview), [overview]);
  const sourcePerformance = useMemo(
    () => buildSourcePerformance(overview),
    [overview],
  );
  const filteredSourcePerformance = useMemo(
    () =>
      sourceFilter === "all"
        ? sourcePerformance
        : sourcePerformance.filter((item) => item.source === sourceFilter),
    [sourceFilter, sourcePerformance],
  );
  const errorItems = useMemo(() => buildErrors(overview), [overview]);
  const performanceRows = useMemo(
    () => buildPerformanceRows(overview),
    [overview],
  );

  const totalTransactions = Number(overview?.metrics.totalTransactions || 0);
  const totalVolume = Number(overview?.metrics.totalVolume || 0);
  const requestedVolume = Number(overview?.metrics.requestedVolume || 0);
  const netRevenue = Number(overview?.metrics.netRevenue || 0);
  const conversionRate = Number(overview?.metrics.conversionRate || 0);

  const topPerformers = [...bankSeries]
    .sort((left, right) => right.success - left.success)
    .slice(0, 5)
    .map((item) => ({ name: item.name, value: item.success }));

  const lowPerformers = [...bankSeries]
    .sort((left, right) => left.success - right.success)
    .slice(0, 5)
    .map((item) => ({ name: item.name, value: item.success }));

  function handleExportOverview() {
    if (!overview) {
      return;
    }

    const rows = [
      ["Dashboard Summary"],
      ["Period", selectedPeriod.label],
      ["Transactions", String(totalTransactions)],
      ["Collected Volume", String(totalVolume)],
      ["Net Revenue", String(netRevenue)],
      ["Requested Volume", String(requestedVolume)],
      ["Checkout Sessions", String(overview.metrics.totalCheckoutSessions || 0)],
      ["Gross Volume", String(overview.metrics.grossVolume || 0)],
      [],
      ["Recent Activity"],
      ["Date", "Reference", "Status", "Channel", "Narration", "Amount"],
      ...(overview.recentActivity || []).map((item) => [
        formatDate(item.createdAt),
        item.reference,
        item.status,
        item.channel || item.paymentMethod || "--",
        item.narration || item.customer?.name || "--",
        String(item.amount ?? 0),
      ]),
      [],
      ["Source Performance"],
      [
        "Source",
        "Success Rate",
        "Processed Volume",
        "Requested Volume",
        "Successful Payments",
        "Pending Sessions",
        "Failed Sessions",
      ],
      ...sourcePerformance.map((item) => [
        item.label,
        String(item.successRate),
        String(item.volume),
        String(item.grossVolume),
        String(item.successfulPayments),
        String(item.pendingSessions),
        String(item.failedSessions),
      ]),
    ];

    downloadCsvFile(`aris-pay-dashboard-${days}d.csv`, rows);
  }

  return (
    <MerchantShell
      title="Overview"
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-[6px] bg-white p-1 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDays(option.value)}
                disabled={isLoading}
                className={cn(
                  "h-9 rounded-[4px] px-4 text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
                  days === option.value
                    ? "bg-[var(--brand-panel)] text-white"
                    : "text-[#667085] hover:bg-[var(--brand-soft)]",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Button
            variant="secondary"
            className="bg-white text-[#344054] shadow-[0_12px_28px_rgba(15,23,42,0.06)]"
            rightIcon={<FiArrowUpRight className="h-4 w-4" />}
            disabled={isLoading}
            onClick={handleExportOverview}
          >
            Export
          </Button>
        </div>
      }
    >
      {error ? (
        <p className="mb-6 rounded-[8px] border border-[#ffd8dc] bg-[#fff4f5] px-4 py-3 text-sm text-[#d33a44]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Transactions"
          value={formatNumber(totalTransactions)}
          note={`Customer collections ${selectedPeriod.summaryLabel}`}
          tone="violet"
          icon={<FiActivity className="h-4 w-4" />}
        />
        <DashboardStatCard
          label="Collected volume"
          value={formatCurrency(totalVolume)}
          note={`Successful customer payments ${selectedPeriod.summaryLabel}`}
          tone="blue"
          icon={<FiBarChart2 className="h-4 w-4" />}
        />
        <DashboardStatCard
          label="Net revenue"
          value={formatCurrency(netRevenue)}
          note={`Collections less checkout fees ${selectedPeriod.summaryLabel}`}
          tone="green"
          icon={<FiTrendingUp className="h-4 w-4" />}
        />
        <DashboardStatCard
          label="Requested volume"
          value={formatCurrency(requestedVolume)}
          note={`${conversionRate || 0}% conversion rate`}
          tone="rose"
          icon={<FiArrowUpRight className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6">
        <GroupedBankChart
          banks={bankSeries}
          onOpenTransactions={() => router.push("/dashboard/transactions")}
          onBankSelect={(bankName) => setSearch(bankName)}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
        <SourcePerformancePanel
          items={filteredSourcePerformance}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
        />
        <ErrorList
          items={errorItems}
          periodLabel={selectedPeriod.summaryLabel}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <RankedList
          title="Top performing banks"
          tone="success"
          icon={<FiTrendingUp className="h-4 w-4" />}
          items={topPerformers}
        />
        <RankedList
          title="Low performing banks"
          tone="danger"
          icon={<FiTrendingDown className="h-4 w-4" />}
          items={lowPerformers}
        />
      </div>

      <div className="mt-6">
        <PerformanceTable
          rows={performanceRows}
          search={search}
          onSearchChange={setSearch}
        />
      </div>

      <div className="mt-6">
        <RecentTransactionsPanel
          transactions={overview?.recentActivity || []}
          onViewAll={() => router.push("/dashboard/transactions")}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="bg-[var(--brand-panel)] p-5 text-white shadow-[0_24px_55px_rgba(4,92,56,0.22)]">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] bg-white/10">
            <FiCreditCard className="h-4 w-4" />
          </span>
          <p className="mt-4 text-[12px] uppercase tracking-[0.08em] text-white/70">
            Checkout sessions
          </p>
          <p className="mt-2 text-[22px] font-semibold tracking-[-0.03em]">
            {formatNumber(overview?.metrics.totalCheckoutSessions || 0)}
          </p>
        </Card>

        <Card className="bg-white p-5 shadow-[0_24px_55px_rgba(15,23,42,0.06)]">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] bg-[var(--brand-soft)] text-[var(--brand)]">
            <FiTrendingUp className="h-4 w-4" />
          </span>
          <p className="mt-4 text-[12px] uppercase tracking-[0.08em] text-[#98a2b3]">
            Gross volume
          </p>
          <p className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-[#111827]">
            {formatCurrency(overview?.metrics.grossVolume || totalVolume)}
          </p>
        </Card>

        <Card className="bg-white p-5 shadow-[0_24px_55px_rgba(15,23,42,0.06)]">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#edf2f7] text-[var(--brand-ink)]">
            <FiArrowUpRight className="h-4 w-4" />
          </span>
          <p className="mt-4 text-[12px] uppercase tracking-[0.08em] text-[#98a2b3]">
            Latest batch
          </p>
          <p className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-[#111827]">
            {overview?.recentActivity?.[0]?.createdAt
              ? formatDateTime(overview.recentActivity[0].createdAt)
              : "Awaiting activity"}
          </p>
        </Card>
      </div>
    </MerchantShell>
  );
}
