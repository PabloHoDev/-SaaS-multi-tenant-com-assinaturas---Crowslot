import "server-only";

import { dayRange, monthRange } from "@/lib/dates";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";

import type { OrgContext } from "./tenant";

/** Números da página inicial do painel. Receita só para quem tem `reports:read`. */
export async function getOverview(ctx: OrgContext) {
  const now = new Date();
  const tz = ctx.organization.timezone;
  const today = dayRange(now, tz);
  const month = monthRange(now, tz);
  const orgId = ctx.organizationId;
  const showRevenue = can(ctx.role, "reports:read");

  const [appointmentsToday, clientsCount, completedThisMonth, revenue, upcoming] =
    await Promise.all([
      db.appointment.count({
        where: {
          organizationId: orgId,
          startsAt: { gte: today.start, lt: today.end },
          status: { not: "CANCELED" },
        },
      }),
      db.client.count({ where: { organizationId: orgId } }),
      db.appointment.count({
        where: {
          organizationId: orgId,
          startsAt: { gte: month.start, lt: month.end },
          status: "COMPLETED",
        },
      }),
      showRevenue
        ? db.appointment.aggregate({
            where: {
              organizationId: orgId,
              startsAt: { gte: month.start, lt: month.end },
              status: "COMPLETED",
            },
            _sum: { priceCents: true },
          })
        : null,
      db.appointment.findMany({
        where: {
          organizationId: orgId,
          startsAt: { gte: now },
          status: { in: ["SCHEDULED", "CONFIRMED"] },
        },
        orderBy: { startsAt: "asc" },
        take: 6,
        select: {
          id: true,
          startsAt: true,
          status: true,
          client: { select: { name: true } },
          service: { select: { name: true } },
          professional: { select: { user: { select: { name: true } } } },
        },
      }),
    ]);

  return {
    appointmentsToday,
    clientsCount,
    completedThisMonth,
    revenueThisMonthCents: revenue?._sum.priceCents ?? null,
    upcoming,
  };
}
