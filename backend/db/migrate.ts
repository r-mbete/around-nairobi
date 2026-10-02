import { createDb } from "./index";

// npm run db:migrate — applies db/migrations to DATABASE_URL, or to the local PGlite store if unset.
async function main() {
  const { migrate, close } = createDb();
  await migrate();
  await close();
  console.log(process.env.DATABASE_URL ? "Migrated Postgres." : "Migrated local PGlite database (.pglite/).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
