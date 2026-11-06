import {
  CalendarCheckIcon,
  CalendarDaysIcon,
  type LucideIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { getOverview } from "@/server/dashboard";
import { getOrgContext } from "@/server/tenant";

export const metadata: Metadata = { title: "Visão geral" };

const STATUS_LABEL = { SCHEDULED: "Agendado", CONFIRMED: "Confirmado" } as const;

export default async function OverviewPage({ params }: PageProps<"/app/[slug]">) {
  const { slug } = await params;
  const ctx = await getOrgContext(slug);
  const overview = await getOverview(ctx);

  const timeFormat = new Intl.DateTimeFormat("pt-BR", {
    timeZone: ctx.organization.timezone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <PageHeader title="Visão geral" description={ctx.organization.name} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarDaysIcon}
          label="Agendamentos hoje"
          value={overview.appointmentsToday}
        />
        <StatCard
          icon={CalendarCheckIcon}
          label="Atendidos no mês"
          value={overview.completedThisMonth}
        />
        <StatCard icon={UsersIcon} label="Clientes" value={overview.clientsCount} />
        {overview.revenueThisMonthCents !== null && (
          <StatCard
            icon={WalletIcon}
            label="Receita no mês"
            value={formatCurrency(overview.revenueThisMonthCents)}
          />
        )}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Próximos atendimentos</CardTitle>
          <CardDescription>Os próximos horários marcados na agenda.</CardDescription>
        </CardHeader>
        <CardContent>
          {overview.upcoming.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Nenhum atendimento marcado.
            </p>
          ) : (
            <ul className="divide-y">
              {overview.upcoming.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                  <span className="w-40 font-medium tabular-nums">
                    {timeFormat.format(a.startsAt)}
                  </span>
                  <span className="flex-1">
                    {a.client.name} ·{" "}
                    <span className="text-muted-foreground">{a.service.name}</span>
                  </span>
                  <span className="text-muted-foreground">{a.professional.user.name}</span>
                  <Badge variant={a.status === "CONFIRMED" ? "default" : "outline"}>
                    {STATUS_LABEL[a.status as keyof typeof STATUS_LABEL]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardDescription>{label}</CardDescription>
        <Icon className="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
