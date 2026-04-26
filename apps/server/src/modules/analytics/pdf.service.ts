// FILE: apps/server/src/modules/analytics/pdf.service.ts
// PURPOSE: Generates expense report PDF using pdfkit
// DEPENDS ON: pdfkit, prisma, decimal.js
// LAST UPDATED: F36 - PDF Export

import PDFDocument from "pdfkit";
import Decimal from "decimal.js";
import { Response } from "express";
import prisma from "../../config/database";
import { ApiError, ErrorCode } from "../../shared/utils/ApiError";
import { calculateGroupBalances } from "../expenses/balance.service";
import { logger } from "../../shared/utils/logger";

// ─────────────────────────────────────────────
// Colors
// ─────────────────────────────────────────────

const COLORS = {
  primary: "#3b82f6",
  dark: "#0f172a",
  muted: "#64748b",
  light: "#f8fafc",
  border: "#e2e8f0",
  success: "#16a34a",
  danger: "#dc2626",
  white: "#ffffff",
};

// ─────────────────────────────────────────────
// Format currency
// ─────────────────────────────────────────────

function fmt(amount: number | string | Decimal, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(
    typeof amount === "object" && amount instanceof Decimal
      ? amount.toNumber()
      : Number(amount)
  );
}

// ─────────────────────────────────────────────
// GENERATE PDF
// Streams directly to Express Response
// ─────────────────────────────────────────────

export async function generateGroupPdf(
  groupId: string,
  userId: string,
  res: Response
): Promise<void> {
  // Verify membership
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true },
  });

  if (!member) {
    throw ApiError.forbidden(
      "You are not a member of this group",
      ErrorCode.NOT_GROUP_MEMBER
    );
  }

  // Fetch all data
  const [group, expenses, members, balances] = await Promise.all([
    prisma.group.findUnique({
      where: { id: groupId },
      select: {
        name: true,
        description: true,
        type: true,
        createdAt: true,
        _count: { select: { members: true } },
      },
    }),
    prisma.expense.findMany({
      where: { groupId, isDeleted: false },
      include: {
        paidByUser: { select: { name: true } },
        splits: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { expenseDate: "desc" },
    }),
    prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, name: true } },
      },
    }),
    calculateGroupBalances(groupId),
  ]);

  if (!group) {
    throw ApiError.notFound("Group");
  }

  // Calculate totals
  let grandTotal = new Decimal(0);
  const categoryTotals: Record<string, Decimal> = {};

  expenses.forEach((e) => {
    grandTotal = grandTotal.plus(e.totalAmount);
    const cat = e.category;
    categoryTotals[cat] = (categoryTotals[cat] ?? new Decimal(0)).plus(
      e.totalAmount
    );
  });

  // ── Create PDF ──
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: `${group.name} — Expense Report`,
      Author: "SplitSync",
      Subject: "Group Expense Report",
    },
  });

  // Stream to response
  const filename = `splitsync-${group.name.replace(/\s+/g, "-").toLowerCase()}-report.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`
  );
  doc.pipe(res);

  const pageWidth = doc.page.width - 100; // margins

  // ────────────────────────────────────────────
  // HEADER
  // ────────────────────────────────────────────

  // Blue header band
  doc
    .rect(0, 0, doc.page.width, 90)
    .fill(COLORS.primary);

  // Logo placeholder + title
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(COLORS.white)
    .text("SplitSync", 50, 28);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("rgba(255,255,255,0.8)")
    .text("Expense Report", 50, 55);

  // Generated date (right side)
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("rgba(255,255,255,0.8)")
    .text(
      `Generated: ${new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`,
      0,
      40,
      { align: "right", width: doc.page.width - 50 }
    );

  // ────────────────────────────────────────────
  // GROUP INFO
  // ────────────────────────────────────────────

  let y = 110;

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(COLORS.dark)
    .text(group.name, 50, y);

  y += 25;

  if (group.description) {
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text(group.description, 50, y);
    y += 18;
  }

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(
      `${group._count.members} members  ·  ${expenses.length} expenses  ·  Created ${new Date(group.createdAt).toLocaleDateString("en-IN")}`,
      50,
      y
    );

  y += 30;

  // ────────────────────────────────────────────
  // SUMMARY BOX
  // ────────────────────────────────────────────

  doc
    .rect(50, y, pageWidth, 60)
    .fill(COLORS.light)
    .stroke(COLORS.border);

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text("TOTAL EXPENSES", 70, y + 12);

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(COLORS.primary)
    .text(fmt(grandTotal), 70, y + 24);

  // Right side: avg + count
  const summaryRight = 50 + pageWidth - 150;

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text("Avg Per Expense", summaryRight, y + 12)
    .text("Expense Count", summaryRight, y + 30);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.dark)
    .text(
      expenses.length > 0
        ? fmt(grandTotal.div(expenses.length))
        : "₹0.00",
      summaryRight + 100,
      y + 12,
      { align: "right", width: 50 }
    )
    .text(String(expenses.length), summaryRight + 100, y + 30, {
      align: "right",
      width: 50,
    });

  y += 80;

  // ────────────────────────────────────────────
  // CATEGORY BREAKDOWN
  // ────────────────────────────────────────────

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.dark)
    .text("Category Breakdown", 50, y);

  y += 18;

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b.minus(a).toNumber())
    .slice(0, 6);

  const colWidth = pageWidth / Math.min(3, sortedCategories.length);

  sortedCategories.forEach(([cat, total], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = 50 + col * colWidth;
    const cy = y + row * 45;

    doc.rect(cx, cy, colWidth - 6, 38).fill(COLORS.light);

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(cat.toUpperCase(), cx + 8, cy + 7);

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(COLORS.dark)
      .text(fmt(total), cx + 8, cy + 19);
  });

  const catRows = Math.ceil(sortedCategories.length / 3);
  y += catRows * 45 + 20;

  // ────────────────────────────────────────────
  // EXPENSE TABLE
  // ────────────────────────────────────────────

  // Check if we need a new page
  if (y > doc.page.height - 200) {
    doc.addPage();
    y = 50;
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.dark)
    .text("Expense Details", 50, y);

  y += 18;

  // Table header
  const colWidths = {
    date: 65,
    title: 180,
    category: 80,
    paidBy: 90,
    amount: 85,
  };

  // Header row background
  doc.rect(50, y, pageWidth, 22).fill(COLORS.primary);

  doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.white);

  let cx = 55;
  doc.text("DATE", cx, y + 7);
  cx += colWidths.date;
  doc.text("EXPENSE", cx, y + 7);
  cx += colWidths.title;
  doc.text("CATEGORY", cx, y + 7);
  cx += colWidths.category;
  doc.text("PAID BY", cx, y + 7);
  cx += colWidths.paidBy;
  doc.text("AMOUNT", cx, y + 7, {
    width: colWidths.amount,
    align: "right",
  });

  y += 22;

  // Table rows
  let rowCount = 0;
  const maxRows = 30; // Prevent huge PDFs

  for (const expense of expenses.slice(0, maxRows)) {
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = 50;
    }

    const isEven = rowCount % 2 === 0;
    if (isEven) {
      doc.rect(50, y, pageWidth, 20).fill(COLORS.light);
    }

    doc.font("Helvetica").fontSize(8).fillColor(COLORS.dark);

    cx = 55;
    doc.text(
      new Date(expense.expenseDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      }),
      cx,
      y + 6
    );

    cx += colWidths.date;
    doc.text(
      expense.title.length > 28
        ? `${expense.title.slice(0, 28)}...`
        : expense.title,
      cx,
      y + 6
    );

    cx += colWidths.title;
    doc.text(expense.category, cx, y + 6);

    cx += colWidths.category;
    doc.text(
      expense.paidByUser.name.split(" ")[0],
      cx,
      y + 6
    );

    cx += colWidths.paidBy;
    doc
      .font("Helvetica-Bold")
      .text(fmt(expense.totalAmount, expense.currency), cx, y + 6, {
        width: colWidths.amount,
        align: "right",
      });

    y += 20;
    rowCount++;
  }

  if (expenses.length > maxRows) {
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(
        `... and ${expenses.length - maxRows} more expenses`,
        50,
        y + 5
      );
    y += 20;
  }

  // Total row
  doc.rect(50, y, pageWidth, 22).fill(COLORS.dark);
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.white)
    .text("TOTAL", 55, y + 7)
    .text(fmt(grandTotal), 55, y + 7, {
      width: pageWidth - 10,
      align: "right",
    });

  y += 35;

  // ────────────────────────────────────────────
  // MEMBER BALANCES
  // ────────────────────────────────────────────

  if (balances.members.length > 0) {
    if (y > doc.page.height - 150) {
      doc.addPage();
      y = 50;
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(COLORS.dark)
      .text("Member Balances", 50, y);

    y += 18;

    balances.members.forEach((member) => {
      const net = parseFloat(member.netBalance);
      const isPositive = net > 0.01;
      const isNegative = net < -0.01;

      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 50;
      }

      doc.rect(50, y, pageWidth, 28).fill(COLORS.light);

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(COLORS.dark)
        .text(member.userName, 60, y + 10);

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(
          `Paid: ${fmt(member.totalPaid)}  ·  Owes: ${fmt(member.totalOwed)}`,
          60,
          y + 19
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(
          isPositive
            ? COLORS.success
            : isNegative
              ? COLORS.danger
              : COLORS.muted
        )
        .text(
          `${isPositive ? "+" : ""}${fmt(Math.abs(net))}`,
          50,
          y + 10,
          { width: pageWidth - 10, align: "right" }
        );

      y += 32;
    });
  }

  // ────────────────────────────────────────────
  // SETTLEMENT SUGGESTIONS
  // ────────────────────────────────────────────

  if (balances.debts.length > 0) {
    if (y > doc.page.height - 150) {
      doc.addPage();
      y = 50;
    }

    y += 10;

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(COLORS.dark)
      .text("Settlement Suggestions", 50, y);

    y += 18;

    balances.debts.forEach((debt) => {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 50;
      }

      doc.rect(50, y, pageWidth, 26).fill(COLORS.light);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(COLORS.dark)
        .text(
          `${debt.from.name}  →  ${debt.to.name}`,
          60,
          y + 9
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(COLORS.danger)
        .text(fmt(debt.amount, debt.currency), 50, y + 9, {
          width: pageWidth - 10,
          align: "right",
        });

      y += 30;
    });
  }

  // ────────────────────────────────────────────
  // FOOTER
  // ────────────────────────────────────────────

  const totalPages = (doc.bufferedPageRange().count || 1);
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(
        `SplitSync — ${group.name} Expense Report`,
        50,
        doc.page.height - 40,
        { width: pageWidth / 2 }
      )
      .text(
        `Page ${i + 1} of ${totalPages}`,
        50,
        doc.page.height - 40,
        { width: pageWidth, align: "right" }
      );
  }

  doc.end();

  logger.info(
    `[PDF] Generated report for group ${groupId}: ${expenses.length} expenses`
  );
}