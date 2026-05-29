import type { Config } from "drizzle-kit";

const url = process.env["DATABASE_URL"];
if (!url) {
  throw new Error(
    "DATABASE_URL is required. Set it in .env (see .env.example) or shell.",
  );
}

export default {
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
} satisfies Config;
