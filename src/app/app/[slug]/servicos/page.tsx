import { PlusIcon, ScissorsIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDuration } from "@/lib/format";
import { getLimit } from "@/lib/plans";
import { can } from "@/lib/rbac";
import { listServices } from "@/server/services";
import { getOrgContext } from "@/server/tenant";

export const metadata: Metadata = { title: "Serviços" };

export default async function ServicesPage({ params }: PageProps<"/app/[slug]/servicos">) {
  const { slug } = await params;
  const ctx = await getOrgContext(slug);
  const services = await listServices(ctx);

  const base = `/app/${slug}/servicos`;
  const canWrite = can(ctx.role, "services:write");
  const activeCount = services.filter((s) => s.active).length;
  const limit = getLimit(ctx.organization.plan, "services");
  const limitReached = activeCount >= limit;

  return (
    <>
      <PageHeader
        title="Serviços"
        description={
          Number.isFinite(limit)
            ? `${activeCount} de ${limit} serviços ativos do plano Free.`
            : `${activeCount} serviços ativos.`
        }
        actions={
          canWrite &&
          (limitReached ? (
            <span className="text-muted-foreground text-sm">
              Limite atingido — desative um serviço ou faça upgrade para o Pro.
            </span>
          ) : (
            <Link href={`${base}/novo`} className={buttonVariants()}>
              <PlusIcon />
              Novo serviço
            </Link>
          ))
        }
      />

      <Card>
        <CardContent>
          {services.length === 0 ? (
            <EmptyState newHref={canWrite ? `${base}/novo` : null} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead className="text-right">Duração</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Agendamentos</TableHead>
                  <TableHead className="text-right">Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.id} className={s.active ? undefined : "text-muted-foreground"}>
                    <TableCell className="font-medium">
                      {canWrite ? (
                        <Link href={`${base}/${s.id}`} className="hover:underline">
                          {s.name}
                        </Link>
                      ) : (
                        s.name
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDuration(s.durationMin)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(s.priceCents)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {s.appointments}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={s.active ? "secondary" : "outline"}>
                        {s.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function EmptyState({ newHref }: { newHref: string | null }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <ScissorsIcon className="text-muted-foreground size-8" />
      <p className="text-sm font-medium">Nenhum serviço cadastrado ainda.</p>
      <p className="text-muted-foreground max-w-xs text-sm">
        Cadastre o que o salão oferece, com duração e preço, para começar a agendar.
      </p>
      {newHref && (
        <Link href={newHref} className={buttonVariants({ variant: "outline" })}>
          <PlusIcon />
          Cadastrar o primeiro
        </Link>
      )}
    </div>
  );
}
