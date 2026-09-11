"use client";

import { Button } from "@/components/ui/Button";
import type { AgentRow, MonthlyStatement } from "./page";

function csvCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function MonthlyStatementExportButton({
  statement,
  rows,
}: {
  statement: MonthlyStatement;
  rows: AgentRow[];
}) {
  function handleExport() {
    const summarySection = toCsv([
      ["OpenHouseIQ Monthly Statement"],
      ["Period", statement.monthLabel],
      [],
      ["New signups", statement.newSignups],
      ["New subscriptions", statement.newSubscriptions],
      ["Cancellations", statement.cancellations],
      ["Revenue collected", `$${statement.revenue.toFixed(2)}`],
      [],
      ["Agents (current snapshot)"],
    ]);

    const agentHeader = [
      "Name",
      "Email",
      "Signed up",
      "Status",
      "Trial ends",
      "Renews",
      "Listings",
      "Feedback",
      "Offers",
      "Pilot feedback submitted",
    ];
    const agentRowsCsv = rows.map((row) => [
      row.fullName,
      row.email,
      new Date(row.createdAt).toLocaleDateString(),
      row.status,
      row.trialEndsAt ? new Date(row.trialEndsAt).toLocaleDateString() : "",
      row.currentPeriodEnd ? new Date(row.currentPeriodEnd).toLocaleDateString() : "",
      row.listingsCount,
      row.feedbackCount,
      row.offersCount,
      row.productFeedbackSubmittedAt
        ? new Date(row.productFeedbackSubmittedAt).toLocaleDateString()
        : "",
    ]);
    const agentSection = toCsv([agentHeader, ...agentRowsCsv]);

    downloadCsv(
      `openhouseiq-statement-${statement.monthKey}.csv`,
      `${summarySection}\n${agentSection}`,
    );
  }

  return (
    <Button variant="secondary" onClick={handleExport} disabled={rows.length === 0}>
      Export monthly statement
    </Button>
  );
}
