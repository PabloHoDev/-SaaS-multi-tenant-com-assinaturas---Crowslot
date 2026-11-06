/**
 * Seed de demonstração: cria a "Barbearia Exemplo" com equipe, serviços,
 * clientes e ~3 meses de agendamentos (passados e futuros).
 *
 * Determinístico (PRNG com semente fixa) e idempotente: apaga a organização
 * de demo antes de recriá-la. Uso: `npm run db:seed`.
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, type AppointmentStatus, type Prisma } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const DEMO_SLUG = "barbearia-exemplo";
const TZ_OFFSET = "-03:00"; // America/Sao_Paulo (sem horário de verão desde 2019)

// mulberry32 — PRNG pequeno e determinístico
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = rng(42);
const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)]!;

const FIRST_NAMES = [
  "Ana",
  "Bruno",
  "Carla",
  "Diego",
  "Eduarda",
  "Felipe",
  "Gabriela",
  "Henrique",
  "Isabela",
  "João",
  "Larissa",
  "Lucas",
  "Mariana",
  "Mateus",
  "Natália",
  "Otávio",
  "Paula",
  "Rafael",
  "Sabrina",
  "Thiago",
  "Vanessa",
  "Vinícius",
  "Yasmin",
  "Rodrigo",
  "Camila",
];
const LAST_NAMES = [
  "Silva",
  "Souza",
  "Oliveira",
  "Santos",
  "Lima",
  "Pereira",
  "Costa",
  "Almeida",
  "Ferreira",
  "Rodrigues",
  "Gomes",
  "Martins",
  "Araújo",
  "Ribeiro",
  "Carvalho",
];

const SERVICES = [
  { name: "Corte masculino", durationMin: 30, priceCents: 4500 },
  { name: "Barba completa", durationMin: 30, priceCents: 3500 },
  { name: "Corte + barba", durationMin: 60, priceCents: 7000 },
  { name: "Corte feminino", durationMin: 60, priceCents: 8000 },
  { name: "Escova", durationMin: 45, priceCents: 6000 },
  { name: "Coloração", durationMin: 90, priceCents: 15000 },
] as const;

function slugifyEmail(name: string) {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, ".");
}

function localDate(day: Date, hour: number, minute: number) {
  const iso = day.toISOString().slice(0, 10);
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`${iso}T${hh}:${mm}:00${TZ_OFFSET}`);
}

async function main() {
  console.info("🌱 Limpando dados de demo anteriores…");
  await db.organization.deleteMany({ where: { slug: DEMO_SLUG } });

  const [owner, barber, stylist] = await Promise.all(
    [
      { email: "demo@crowslot.dev", name: "Pablo (Dono)" },
      { email: "carlos@crowslot.dev", name: "Carlos Barbeiro" },
      { email: "juliana@crowslot.dev", name: "Juliana Cabeleireira" },
    ].map((u) =>
      db.user.upsert({
        where: { email: u.email },
        update: { name: u.name },
        create: { ...u, emailVerified: new Date() },
      }),
    ),
  );

  const org = await db.organization.create({
    data: {
      name: "Barbearia Exemplo",
      slug: DEMO_SLUG,
      plan: "PRO",
      memberships: {
        create: [
          { userId: owner!.id, role: "OWNER" },
          { userId: barber!.id, role: "ADMIN" },
          { userId: stylist!.id, role: "MEMBER" },
        ],
      },
      services: { create: SERVICES.map((s) => ({ ...s })) },
    },
    include: { memberships: true, services: true },
  });

  const clients = await db.client.createManyAndReturn({
    data: Array.from({ length: 80 }, () => {
      const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      return {
        organizationId: org.id,
        name,
        email:
          random() > 0.3 ? `${slugifyEmail(name)}${Math.floor(random() * 100)}@email.com` : null,
        phone: `(85) 9${Math.floor(10000000 + random() * 89999999)}`,
      };
    }),
  });

  // Agendamentos: de 60 dias atrás até 14 dias à frente, de seg a sáb, 9h–18h.
  // Cada profissional tem a agenda preenchida sequencialmente, então nunca há sobreposição.
  const today = new Date();
  const appointments: Prisma.AppointmentCreateManyInput[] = [];

  for (let offset = -60; offset <= 14; offset++) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() + offset);
    if (day.getUTCDay() === 0) continue; // domingo fechado

    for (const professional of org.memberships) {
      let minutes = 9 * 60;
      while (minutes < 18 * 60) {
        // ~35% dos horários ficam livres → taxa de ocupação realista
        if (random() < 0.35) {
          minutes += 30;
          continue;
        }
        const service = pick(org.services);
        if (minutes + service.durationMin > 18 * 60) break;

        const startsAt = localDate(day, Math.floor(minutes / 60), minutes % 60);
        const endsAt = new Date(startsAt.getTime() + service.durationMin * 60_000);
        const isPast = endsAt < today;

        let status: AppointmentStatus = isPast ? "COMPLETED" : "SCHEDULED";
        const roll = random();
        if (isPast && roll < 0.06) status = "NO_SHOW";
        else if (roll < 0.1) status = "CANCELED";
        else if (!isPast && roll < 0.5) status = "CONFIRMED";

        appointments.push({
          organizationId: org.id,
          clientId: pick(clients).id,
          serviceId: service.id,
          professionalId: professional.id,
          startsAt,
          endsAt,
          status,
          priceCents: service.priceCents,
        });
        minutes += service.durationMin;
      }
    }
  }

  await db.appointment.createMany({ data: appointments });

  await db.auditLog.create({
    data: {
      organizationId: org.id,
      actorId: owner!.id,
      action: "organization.created",
      entity: "organization",
      entityId: org.id,
    },
  });

  console.info(
    `✅ ${org.name}: ${org.memberships.length} membros, ${org.services.length} serviços, ` +
      `${clients.length} clientes, ${appointments.length} agendamentos.`,
  );
  console.info(`   Login de demo: demo@crowslot.dev → /app/${DEMO_SLUG}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
