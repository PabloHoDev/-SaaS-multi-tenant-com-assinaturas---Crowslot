import type { Metadata } from "next";
import { Suspense } from "react";

import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/server/tenant";

import { CreateOrganizationForm } from "./create-organization-form";

export const metadata: Metadata = { title: "Criar seu espaço" };

export default function OnboardingPage() {
  return (
    <main className="bg-muted/40 flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <Logo />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">
            <Suspense fallback="Bem-vindo!">
              <Greeting />
            </Suspense>
          </CardTitle>
          <CardDescription>
            Crie o espaço do seu salão ou barbearia. Você poderá convidar sua equipe em seguida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-24 w-full" />}>
            <AuthenticatedForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}

async function Greeting() {
  const user = await requireUser();
  const firstName = user.name?.split(" ")[0];
  return firstName ? `Bem-vindo, ${firstName}!` : "Bem-vindo!";
}

/** Garante a sessão antes de exibir o formulário (a action também revalida). */
async function AuthenticatedForm() {
  await requireUser();
  return <CreateOrganizationForm />;
}
