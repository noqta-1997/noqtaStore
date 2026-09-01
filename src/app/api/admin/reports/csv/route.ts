import { NextResponse, type NextRequest } from "next/server";

import { getCategoryShares, getSalesSeries, getTopBooks } from "@/data";
import { isLocale, defaultLocale } from "@/i18n/config";
import { getCurrentCustomer } from "@/lib/auth";

/** Quotes a field so commas, quotes and newlines survive a spreadsheet. */
function cell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: (string | number)[][]) {
  return rows.map((row) => row.map(cell).join(",")).join("\r\n");
}

/**
 * The reports screen as a spreadsheet. Managers only: the same role check the
 * admin pages use, because a route handler is not behind that layout.
 */
export async function GET(request: NextRequest) {
  const manager = await getCurrentCustomer();
  if (manager?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const raw = request.nextUrl.searchParams.get("locale") ?? "";
  const locale = isLocale(raw) ? raw : defaultLocale;

  const [series, shares, top] = await Promise.all([
    getSalesSeries(),
    getCategoryShares(),
    getTopBooks(),
  ]);

  const rows: (string | number)[][] = [
    ["month", "revenue_iqd", "orders"],
    ...series.map((point) => [point.month, point.revenue, point.orders]),
    [],
    ["book", "copies_sold", "revenue_iqd"],
    ...top.map((entry) => [entry.book.title[locale], entry.sold, entry.revenue]),
    [],
    ["category", "share_percent"],
    ...shares.map((entry) => [entry.category.name[locale], entry.share]),
  ];

  const stamp = new Date().toISOString().slice(0, 10);

  // The BOM keeps Excel from mangling the Arabic titles.
  return new NextResponse(`﻿${toCsv(rows)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="noqta-report-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
