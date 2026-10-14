import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Compiled output: drizzle-kit cannot resolve the .js-suffixed NodeNext imports in src
  // (run `pnpm --filter @99acres/db build` first)
  schema: "./dist/schema/*.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env["DATABASE_URL"] ?? "postgresql://postgres:postgres@localhost:5432/acres99",
  },
  verbose: true,
  strict: true,
});
