import { prisma } from "../lib/prisma.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function toNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolvePeriod(period) {
  const normalized = period ?? "30d";
  if (normalized === "all") {
    return { key: "all", from: null };
  }

  const days = {
    "7d": 7,
    "30d": 30,
    "90d": 90
  }[normalized] ?? 30;

  return {
    key: `${days}d`,
    from: new Date(Date.now() - days * DAY_MS)
  };
}

function toDateKey(dateValue) {
  const date = new Date(dateValue);
  return date.toISOString().slice(0, 10);
}

export async function getRevenueAnalytics(period) {
  const { key, from } = resolvePeriod(period);
  const where = from
    ? {
        OR: [{ calloutPaidAt: { gte: from } }, { finalPaidAt: { gte: from } }]
      }
    : undefined;

  const payments = await prisma.payment.findMany({
    where,
    select: {
      calloutAmount: true,
      finalAmount: true,
      calloutPaidAt: true,
      finalPaidAt: true
    },
    orderBy: { createdAt: "asc" }
  });

  const timelineMap = new Map();
  let totalCalloutPaid = 0;
  let totalFinalPaid = 0;

  for (const payment of payments) {
    if (payment.calloutPaidAt) {
      const amount = toNumber(payment.calloutAmount);
      totalCalloutPaid += amount;
      const dayKey = toDateKey(payment.calloutPaidAt);
      timelineMap.set(dayKey, (timelineMap.get(dayKey) ?? 0) + amount);
    }

    if (payment.finalPaidAt) {
      const amount = toNumber(payment.finalAmount);
      totalFinalPaid += amount;
      const dayKey = toDateKey(payment.finalPaidAt);
      timelineMap.set(dayKey, (timelineMap.get(dayKey) ?? 0) + amount);
    }
  }

  const timeline = Array.from(timelineMap.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, revenue]) => ({
      date,
      revenue: Number(revenue.toFixed(2))
    }));

  return {
    period: key,
    totals: {
      totalCalloutPaid: Number(totalCalloutPaid.toFixed(2)),
      totalFinalPaid: Number(totalFinalPaid.toFixed(2)),
      totalRevenue: Number((totalCalloutPaid + totalFinalPaid).toFixed(2))
    },
    timeline
  };
}

export async function getOrdersAnalytics(period) {
  const { key, from } = resolvePeriod(period);
  const where = from ? { createdAt: { gte: from } } : undefined;

  const [totalOrders, byStatusRaw, byPriceTypeRaw] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.groupBy({
      by: ["status"],
      where,
      _count: { _all: true }
    }),
    prisma.order.groupBy({
      by: ["priceType"],
      where,
      _count: { _all: true }
    })
  ]);

  const byStatus = byStatusRaw.map((item) => ({ status: item.status, count: item._count._all }));
  const byPriceType = byPriceTypeRaw.map((item) => ({ priceType: item.priceType, count: item._count._all }));

  return {
    period: key,
    totalOrders,
    byStatus,
    byPriceType
  };
}

export async function getMastersAnalytics(period) {
  const { key, from } = resolvePeriod(period);

  const assignments = await prisma.assignment.findMany({
    where: from ? { createdAt: { gte: from } } : undefined,
    select: {
      masterId: true,
      order: { select: { status: true } }
    }
  });

  const masters = await prisma.user.findMany({
    where: { role: "MASTER" },
    select: {
      id: true,
      name: true
    }
  });

  const statsMap = new Map(
    masters.map((master) => [
      master.id,
      {
        masterId: master.id,
        masterName: master.name,
        totalAssignments: 0,
        activeAssignments: 0,
        doneAssignments: 0
      }
    ])
  );

  for (const assignment of assignments) {
    const stat = statsMap.get(assignment.masterId);
    if (!stat) {
      continue;
    }
    stat.totalAssignments += 1;
    if (["ASSIGNED", "EN_ROUTE", "IN_PROGRESS"].includes(assignment.order.status)) {
      stat.activeAssignments += 1;
    }
    if (assignment.order.status === "DONE") {
      stat.doneAssignments += 1;
    }
  }

  const mastersStats = Array.from(statsMap.values()).sort((a, b) => b.totalAssignments - a.totalAssignments);

  return {
    period: key,
    totals: {
      mastersCount: masters.length,
      assignmentsCount: assignments.length
    },
    masters: mastersStats
  };
}
