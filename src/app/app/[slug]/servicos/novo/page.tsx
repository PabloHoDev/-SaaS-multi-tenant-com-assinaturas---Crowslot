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
import { countActiveServices } from "@/server/services";
import { getOrgContext } from "@/server/tenant";

import { ServiceForm } from "../service-form";

export const metadata: Metadata = { title: "Novo serviço" };

export default async function NewServicePage({ params }: PageProps<"/app/[slug]/servicos/novo">) {
  const { slug } = await params;
  const ctx = await getOrgContext(slug);
  if (!can(ctx.role, "services:write")) notFound();

  // Checagem antecipada só para a UX; a regra de verdade roda de novo no servidor ao salvar.
  const withinLimit = isWithinLimit(
    ctx.organization.plan,
    "services",
    await countActiveServices(ctx),
  );

  return (
    <div className="max-w-2xl">
      <Link
        href={`/app/${slug}/servicos`}
        className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-2 -ml-2" })}
      >
        <ArrowLeftIcon />
        Serviços
      </Link>
      <PageHeader
        title="Novo serviço"
        description="A duração define o tamanho do horário na agenda."
      />
      {withinLimit ? (
        <Card>
          <CardContent>
            <ServiceForm slug={slug} />
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertTitle>Limite do plano Free atingido</AlertTitle>
          <AlertDescription>
            Você já tem {getLimit(ctx.organization.plan, "services")} serviços ativos. Desative um
            serviço que não oferece mais ou faça upgrade para o Pro.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
