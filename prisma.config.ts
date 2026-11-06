import "dotenv/config";
import { defineConfig } from "prisma/config";

// O CLI (migrations) usa a conexão direta; a aplicação usa DATABASE_URL (pooler)
// via driver adapter em src/lib/db.ts. Sem DIRECT_URL, cai para DATABASE_URL.
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) throw new Error("Defina DATABASE_URL (e DIRECT_URL, se usar pooler) no .env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: { url },
});
