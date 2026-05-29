import { customType } from "drizzle-orm/pg-core";

/**
 * Custom column types for the bits Drizzle doesn't ship out of the box.
 * The runtime is just a typed wrapper around the underlying SQL type — actual
 * type behavior is enforced by Postgres (CITEXT case-fold, INET parse).
 */

export const citext = customType<{ data: string; driverData: string }>({
  dataType: () => "citext",
});

export const inet = customType<{ data: string; driverData: string }>({
  dataType: () => "inet",
});
