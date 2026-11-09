import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { can } from "@/lib/rbac";
import { idSchema } from "@/lib/validations/common";
import { getService } from "@/server/services";
import { getOrgContext } from "@/server/tenant";

import { ServiceActions } from "../service-actions";
import { ServiceForm } from "../service-form";

export const metadata: Metadata = { title: "Serviço" };

export default async function ServicePage({
  params,
}: PageProps<"/app/[slug]/servicos/[serviceId]">) {
  const { slug, serviceId } = await params;
  const ctx = await getOrgContext(slug);
  // Só quem edita abre a página; para os demais, a lista já mostra tudo.
  if (!can(ctx.role, "services:write")) notFound();
  const service = idSchema.safeParse(serviceId).success ? await getService(ctx, serviceId) : null;
  if (!service) notFound();

  const dateFormat = new Intl.DateTimeFormat("pt-BR", {
    timeZone: ctx.organization.timezone,
    dateStyle: "medium",
  });

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
        title={service.name}
        description={`Cadastrado em ${dateFormat.format(service.createdAt)} · ${service.appointments} agendamento(s)`}
        actions={
          <ServiceActions
            slug={slug}
            serviceId={service.id}
            name={service.name}
            active={service.active}
            hasAppointments={service.appointments > 0}
          />
        }
      />

      <div className="grid gap-6">
        {!service.active && (
          <Alert>
            <AlertDescription>
              Serviço inativo: não aparece nas opções de novos agendamentos. O histórico continua
              intacto.
            </AlertDescription>
          </Alert>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Dados do serviço</CardTitle>
          </CardHeader>
          <CardContent>
            {/* `key` remonta o form quando os dados salvos mudam. */}
            <ServiceForm key={service.id} slug={slug} service={service} />
            {service.appointments > 0 && (
              <p className="text-muted-foreground mt-4 text-xs">
                Mudar o preço vale só para novos agendamentos: os já marcados mantêm o valor
                combinado.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
