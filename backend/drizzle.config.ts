import { defineConfig } from "drizzle-kit";

// Only used to generate SQL migrations from db/schema.ts (`npm run db:generate`); no connection needed.
export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
});
