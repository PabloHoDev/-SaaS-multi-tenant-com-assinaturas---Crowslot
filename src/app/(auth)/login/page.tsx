import type { Metadata } from "next";
import { io } from "next/cache";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth, isGoogleEnabled } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { safeRedirect } from "@/lib/safe-redirect";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

const AUTH_ERRORS: Record<string, string> = {
  Verification: "O link de acesso expirou ou já foi usado. Peça um novo.",
  OAuthAccountNotLinked: "Este e-mail já está ligado a outro método de login.",
  RateLimited: "Muitos pedidos de acesso. Aguarde alguns minutos e tente de novo.",
  AccessDenied: "Não foi possível confirmar sua conta. Use um e-mail verificado.",
  Default: "Não foi possível entrar. Tente novamente.",
};

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Entre no Crowslot</CardTitle>
        <CardDescription>Enviamos um link de acesso para o seu e-mail. Sem senha.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<FormSkeleton />}>
          <LoginContent searchParams={props.searchParams} />
        </Suspense>
      </CardContent>
    </Card>
  );
}

async function LoginContent({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const params = await searchParams;
  const callbackUrl = safeRedirect(params.callbackUrl);

  await io(); // auth() consulta a sessão no banco — ver `requireUser` (server/tenant.ts)
  const session = await auth();
  if (session?.user) redirect(callbackUrl);

  const errorCode = typeof params.error === "string" ? params.error : undefined;
  const error = errorCode ? (AUTH_ERRORS[errorCode] ?? AUTH_ERRORS.Default) : undefined;

  return <LoginForm callbackUrl={callbackUrl} googleEnabled={isGoogleEnabled} error={error} />;
}

function FormSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}
