import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js keeps secrets in .env.local; Prisma 7 does not read env files on its
// own, so the CLI is pointed at the same file the app uses.
loadEnv({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations and introspection go through the session-mode pooler (5432).
    // The transaction-mode pooler in DATABASE_URL is for the app at runtime.
    url: process.env.DIRECT_URL,
  },
});
