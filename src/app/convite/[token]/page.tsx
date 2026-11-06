import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { auth } from "@/auth";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getInvitationByToken } from "@/server/invitations";

import { AcceptButton } from "./accept-button";

export const metadata: Metadata = { title: "Convite", robots: { index: false } };

export default function InvitationPage({ params }: PageProps<"/convite/[token]">) {
  return (
    <main className="bg-muted/40 flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <Logo />
      <Card className="w-full max-w-md">
        <Suspense fallback={<InvitationSkeleton />}>
          <InvitationContent params={params} />
        </Suspense>
      </Card>
    </main>
  );
}

async function InvitationContent({ params }: { params: PageProps<"/convite/[token]">["params"] }) {
  const { token } = await params;
  const [invitation, session] = await Promise.all([getInvitationByToken(token), auth()]);

  if (!invitation) {
    return (
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Convite inválido</CardTitle>
        <CardDescription>
          Este convite expirou, foi cancelado ou já foi usado. Peça um novo convite a quem te
          convidou.
        </CardDescription>
      </CardHeader>
    );
  }

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Junte-se a {invitation.organization.name}</CardTitle>
        <CardDescription>
          {invitation.invitedBy.name ?? "Alguém"} convidou <strong>{invitation.email}</strong> para
          a equipe no Crowslot.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {session?.user ? (
          <>
            {session.user.email !== invitation.email && (
              <p className="text-destructive text-sm">
                Você está conectado como {session.user.email}. Entre com {invitation.email} para
                aceitar.
              </p>
            )}
            <AcceptButton token={token} />
          </>
        ) : (
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(`/convite/${token}`)}`}
            className={buttonVariants()}
          >
            Entrar para aceitar
          </Link>
        )}
      </CardContent>
    </>
  );
}

function InvitationSkeleton() {
  return (
    <CardHeader className="items-center gap-3">
      <Skeleton className="mx-auto h-6 w-56" />
      <Skeleton className="mx-auto h-4 w-72" />
      <Skeleton className="mx-auto mt-2 h-8 w-full" />
    </CardHeader>
  );
}
