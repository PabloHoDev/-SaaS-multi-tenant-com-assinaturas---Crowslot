import Link from "next/link";

import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <Logo />
      <div>
        <p className="text-muted-foreground text-sm font-medium">Erro 404</p>
        <h1 className="mt-1 text-2xl font-semibold">Página não encontrada</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          O endereço não existe ou você não tem acesso a ele.
        </p>
      </div>
      <Link href="/app" className={buttonVariants({ variant: "outline" })}>
        Voltar ao painel
      </Link>
    </main>
  );
}
