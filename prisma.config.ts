import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` must work before a database exists (CI, first install),
// so fall back to a placeholder URL instead of throwing.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
