import {
  BarChart3Icon,
  CalendarClockIcon,
  CheckIcon,
  CreditCardIcon,
  type LucideIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: CalendarClockIcon,
    title: "Agenda sem conflitos",
    description: "Horários por profissional, com bloqueio automático de encaixes sobrepostos.",
  },
  {
    icon: UsersIcon,
    title: "Equipe com permissões",
    description:
      "Convide sua equipe por e-mail. Dono, administrador e profissional veem o que devem.",
  },
  {
    icon: BarChart3Icon,
    title: "Números do negócio",
    description:
      "Receita, atendimentos e taxa de ocupação da sua agenda, atualizados em tempo real.",
  },
  {
    icon: CreditCardIcon,
    title: "Assinatura simples",
    description: "Comece grátis. Mude para o Pro quando crescer, cancele quando quiser.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Dados isolados",
    description: "Cada negócio tem seu espaço. Seus clientes nunca aparecem para outra empresa.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="flex items-center gap-1">
            <a href="#precos" className={buttonVariants({ variant: "ghost" })}>
              Preços
            </a>
            <ThemeToggle />
            <Link href="/login" className={buttonVariants()}>
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 text-center md:py-28">
          <p className="text-primary mb-4 text-sm font-medium">Para salões e barbearias</p>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
            Sua agenda, clientes e equipe em um só lugar
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg text-pretty">
            O Crowslot organiza os horários de cada profissional, guarda o histórico dos seus
            clientes e mostra quanto o seu negócio está faturando.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/login" className={buttonVariants({ size: "lg" })}>
              Começar grátis
            </Link>
            <a href="#recursos" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Ver recursos
            </a>
          </div>
        </section>

        <section id="recursos" className="bg-muted/40 border-y">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-20 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-background rounded-xl border p-6">
                <f.icon className="text-primary mb-4 size-6" />
                <h2 className="font-semibold">{f.title}</h2>
                <p className="text-muted-foreground mt-2 text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="precos" className="mx-auto max-w-4xl px-4 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight">Preços simples</h2>
          <p className="text-muted-foreground mt-3 text-center">
            Sem fidelidade. Sem taxa de adesão.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {Object.values(PLANS).map((plan) => {
              const highlighted = plan.id === "PRO";
              return (
                <Card key={plan.id} className={cn(highlighted && "ring-primary ring-2")}>
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6">
                    <p>
                      <span className="text-4xl font-semibold tabular-nums">
                        {plan.priceCents === 0 ? "Grátis" : formatCurrency(plan.priceCents)}
                      </span>
                      {plan.priceCents > 0 && <span className="text-muted-foreground"> /mês</span>}
                    </p>
                    <ul className="grid gap-2 text-sm">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <CheckIcon className="text-primary size-4" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/login"
                      className={buttonVariants({ variant: highlighted ? "default" : "outline" })}
                    >
                      {highlighted ? "Assinar o Pro" : "Começar grátis"}
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm">
          <Logo />
          <p>Projeto de portfólio · Next.js, Prisma, Stripe</p>
        </div>
      </footer>
    </div>
  );
}
