import { PlusIcon, SearchIcon, UserRoundPlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPhone } from "@/lib/phone";
import { getLimit } from "@/lib/plans";
import { can } from "@/lib/rbac";
import { clientListQuerySchema } from "@/lib/validations/client";
import { listClients } from "@/server/clients";
import { getOrgContext } from "@/server/tenant";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientsPage({
  params,
  searchParams,
}: PageProps<"/app/[slug]/clientes">) {
  const { slug } = await params;
  const ctx = await getOrgContext(slug);
  const { q, page: requestedPage } = clientListQuerySchema.parse(await searchParams);
  const { clients, total, totalInOrg, page, pageCount } = await listClients(ctx, {
    q,
    page: requestedPage,
  });

  const base = `/app/${slug}/clientes`;
  const limit = getLimit(ctx.organization.plan, "clients");
  const limitReached = totalInOrg >= limit;
  const canWrite = can(ctx.role, "clients:write");
  const dateFormat = new Intl.DateTimeFormat("pt-BR", {
    timeZone: ctx.organization.timezone,
    dateStyle: "short",
  });

  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <>
      <PageHeader
        title="Clientes"
        description={
          Number.isFinite(limit)
            ? `${totalInOrg} de ${limit} clientes do plano Free.`
            : `${totalInOrg} clientes cadastrados.`
        }
        actions={
          canWrite &&
          (limitReached ? (
            <span className="text-muted-foreground text-sm">
              Limite atingido — faça upgrade para o Pro.
            </span>
          ) : (
            <Link href={`${base}/novo`} className={buttonVariants()}>
              <PlusIcon />
              Novo cliente
            </Link>
          ))
        }
      />

      <Card>
        <CardContent>
          <Form action={base} replace className="relative mb-4 max-w-sm" role="search">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Buscar por nome, telefone ou e-mail"
              aria-label="Buscar clientes"
              className="pl-8"
            />
          </Form>

          {clients.length === 0 ? (
            <EmptyState
              searching={Boolean(q)}
              newHref={canWrite && !limitReached ? `${base}/novo` : null}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="hidden md:table-cell">E-mail</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">Atendimentos</TableHead>
                    <TableHead className="hidden text-right lg:table-cell">Última visita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <Link href={`${base}/${c.id}`} className="hover:underline">
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell className="tabular-nums">{formatPhone(c.phone) || "—"}</TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">
                        {c.email ?? "—"}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums sm:table-cell">
                        {c.visits}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden text-right tabular-nums lg:table-cell">
                        {c.lastVisitAt ? dateFormat.format(c.lastVisitAt) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-muted-foreground mt-2 text-xs">
                {q ? `${total} resultado(s) para “${q}”.` : `${total} cliente(s).`}
              </p>
              <Pagination page={page} pageCount={pageCount} href={pageHref} />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function EmptyState({ searching, newHref }: { searching: boolean; newHref: string | null }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <UserRoundPlusIcon className="text-muted-foreground size-8" />
      <p className="text-sm font-medium">
        {searching ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
      </p>
      <p className="text-muted-foreground max-w-xs text-sm">
        {searching
          ? "Confira a grafia ou busque pelo telefone."
          : "Cadastre seus clientes para agendar atendimentos e acompanhar o histórico."}
      </p>
      {newHref && !searching && (
        <Link href={newHref} className={buttonVariants({ variant: "outline" })}>
          <PlusIcon />
          Cadastrar o primeiro
        </Link>
      )}
    </div>
  );
}
