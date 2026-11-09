/**
 * Planos e limites. A fonte da verdade sobre "o que cada plano permite"
 * fica no código (versionada e testada); o Stripe só informa qual plano
 * a organização tem.
 */

export type PlanId = "FREE" | "PRO";
export type LimitedResource = "clients" | "members" | "services";

type PlanDefinition = {
  id: PlanId;
  name: string;
  priceCents: number;
  description: string;
  limits: Record<LimitedResource, number>;
  features: string[];
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  FREE: {
    id: "FREE",
    name: "Free",
    priceCents: 0,
    description: "Para quem está começando e atende sozinho.",
    limits: { clients: 50, members: 2, services: 10 },
    features: ["Até 50 clientes", "Até 2 profissionais", "Agenda e dashboard"],
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    priceCents: 4990,
    description: "Para salões e barbearias com equipe.",
    limits: { clients: Infinity, members: 15, services: Infinity },
    features: ["Clientes ilimitados", "Até 15 profissionais", "Exportação CSV", "Log de auditoria"],
  },
};

export function getLimit(plan: PlanId, resource: LimitedResource): number {
  return PLANS[plan].limits[resource];
}

/** `currentCount` é a quantidade atual, antes da criação do novo item. */
export function isWithinLimit(plan: PlanId, resource: LimitedResource, currentCount: number) {
  return currentCount < getLimit(plan, resource);
}

const RESOURCE_LABEL: Record<LimitedResource, string> = {
  clients: "clientes",
  members: "pessoas na equipe",
  services: "serviços",
};

export class PlanLimitError extends Error {
  constructor(
    public readonly resource: LimitedResource,
    public readonly limit: number,
  ) {
    super(
      `Seu plano permite até ${limit} ${RESOURCE_LABEL[resource]}. Faça upgrade para o Pro para continuar.`,
    );
    this.name = "PlanLimitError";
  }
}

export function assertWithinLimit(plan: PlanId, resource: LimitedResource, currentCount: number) {
  if (!isWithinLimit(plan, resource, currentCount)) {
    throw new PlanLimitError(resource, getLimit(plan, resource));
  }
}
