import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLimit, isWithinLimit } from "@/lib/plans";
import { can } from "@/lib/rbac";
import { countClients } from "@/server/clients";
import { getOrgContext } from "@/server/tenant";

import { ClientForm } from "../client-form";

export const metadata: Metadata = { title: "Novo cliente" };

export default async function NewClientPage({ params }: PageProps<"/app/[slug]/clientes/novo">) {
  const { slug } = await params;
  const ctx = await getOrgContext(slug);
  if (!can(ctx.role, "clients:write")) notFound();

  // Checagem antecipada só para a UX; a regra de verdade roda de novo no servidor ao salvar.
  const withinLimit = isWithinLimit(ctx.organization.plan, "clients", await countClients(ctx));

  return (
    <div className="max-w-2xl">
      <Link
        href={`/app/${slug}/clientes`}
        className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-2 -ml-2" })}
      >
        <ArrowLeftIcon />
        Clientes
      </Link>
      <PageHeader title="Novo cliente" description="Só o nome é obrigatório." />
      {withinLimit ? (
        <Card>
          <CardContent>
            <ClientForm slug={slug} />
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertTitle>Limite do plano Free atingido</AlertTitle>
          <AlertDescription>
            Você já tem {getLimit(ctx.organization.plan, "clients")} clientes cadastrados. Faça
            upgrade para o Pro para ter clientes ilimitados.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
