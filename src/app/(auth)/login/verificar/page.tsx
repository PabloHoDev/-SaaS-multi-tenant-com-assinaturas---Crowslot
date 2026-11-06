import { MailCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Verifique seu e-mail" };

export default function VerifyRequestPage() {
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <MailCheckIcon className="text-primary mx-auto mb-2 size-10" />
        <CardTitle className="text-xl">Confira seu e-mail</CardTitle>
        <CardDescription>
          Enviamos um link de acesso. Ele expira em 24 horas.{" "}
          <Link href="/login" className="underline underline-offset-4">
            Usar outro e-mail
          </Link>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
