"use client";

import { Button } from "@/components/ui/Button";
import type { AgentRow } from "./page";

function csvCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function AdminExportButton({ rows }: { rows: AgentRow[] }) {
  function handleExport() {
    const header = [
      "Name",
      "Email",
      "Signed up",
      "Status",
      "Trial ends",
      "Renews",
      "Listings",
      "Feedback",
      "Offers",
    ];
    const csvRows = rows.map((row) => [
      row.fullName,
      row.email,
      new Date(row.createdAt).toLocaleDateString(),
      row.status,
      row.trialEndsAt ? new Date(row.trialEndsAt).toLocaleDateString() : "",
      row.currentPeriodEnd ? new Date(row.currentPeriodEnd).toLocaleDateString() : "",
      row.listingsCount,
      row.feedbackCount,
      row.offersCount,
    ]);
    downloadCsv(`openhouseiq-agents-${new Date().toISOString().slice(0, 10)}.csv`, [
      header,
      ...csvRows,
    ]);
  }

  return (
    <Button variant="secondary" onClick={handleExport} disabled={rows.length === 0}>
      Export report
    </Button>
  );
}
