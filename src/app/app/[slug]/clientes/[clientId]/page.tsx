import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APPOINTMENT_STATUS } from "@/lib/appointment-status";
import { formatCurrency } from "@/lib/format";
import { can } from "@/lib/rbac";
import { getClient } from "@/server/clients";
import { getOrgContext } from "@/server/tenant";

import { ClientForm } from "../client-form";
import { DeleteClientButton } from "../delete-client-button";

export const metadata: Metadata = { title: "Cliente" };

export default async function ClientPage({ params }: PageProps<"/app/[slug]/clientes/[clientId]">) {
  const { slug, clientId } = await params;
  const ctx = await getOrgContext(slug);
  const data = clientId.length <= 64 ? await getClient(ctx, clientId) : null;
  if (!data) notFound();

  const { client, history, stats } = data;
  const tz = ctx.organization.timezone;
  const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: tz, dateStyle: "medium" });
  const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    dateStyle: "short",
    timeStyle: "short",
  });
  const showRevenue = can(ctx.role, "reports:read");

  return (
    <>
      <Link
        href={`/app/${slug}/clientes`}
        className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-2 -ml-2" })}
      >
        <ArrowLeftIcon />
        Clientes
      </Link>
      <PageHeader
        title={client.name}
        description={`Cliente desde ${dateFormat.format(client.createdAt)}`}
        actions={
          can(ctx.role, "clients:delete") && (
            <DeleteClientButton slug={slug} clientId={client.id} name={client.name} />
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="grid h-fit gap-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Atendimentos" value={stats.visits} />
            <Stat
              label="Última visita"
              value={stats.lastVisitAt ? dateFormat.format(stats.lastVisitAt) : "—"}
            />
            <Stat label="Faltas" value={stats.noShows} />
            {showRevenue && <Stat label="Total gasto" value={formatCurrency(stats.spentCents)} />}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
              <CardDescription>Os 10 atendimentos mais recentes.</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  Nenhum atendimento ainda.
                </p>
              ) : (
                <ul className="divide-y">
                  {history.map((a) => {
                    const status = APPOINTMENT_STATUS[a.status];
                    return (
                      <li
                        key={a.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm"
                      >
                        <span className="w-32 tabular-nums">
                          {dateTimeFormat.format(a.startsAt)}
                        </span>
                        <span className="flex-1">
                          {a.service.name}
                          <span className="text-muted-foreground">
                            {" "}
                            · {a.professional.user.name}
                          </span>
                        </span>
                        {showRevenue && (
                          <span className="text-muted-foreground tabular-nums">
                            {formatCurrency(a.priceCents)}
                          </span>
                        )}
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Dados do cliente</CardTitle>
          </CardHeader>
          <CardContent>
            {/* `key` remonta o form quando os dados salvos mudam. */}
            <ClientForm key={client.id} slug={slug} client={client} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
