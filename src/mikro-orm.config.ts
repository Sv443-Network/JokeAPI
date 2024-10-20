import { defineConfig } from "@mikro-orm/core";
import { MikroORM } from "@mikro-orm/postgresql";
import { envVarEquals, getEnvVar } from "@lib/env.js";

const config = defineConfig({
  clientUrl: getEnvVar("DATABASE_URL", "stringNoEmpty"),
  charset: "utf8",
  entities: ["dist/**/*.model.js"],
  entitiesTs: ["src/**/*.model.ts"],
  debug: envVarEquals("DATABASE_DEBUG", true),
});

/** MikroORM instance */
export let orm: Awaited<ReturnType<typeof MikroORM.init>>;
/** EntityManager instance */
export let em: typeof orm.em;

/** Load MikroORM instances */
export async function initDatabase() {
  orm = await MikroORM.init(config);
  em = orm.em.fork();

  // run migrations
  try {
    await orm.getSchemaGenerator().updateSchema();
  }
  catch(e) {
    console.error("Error running migrations:", e);
    setImmediate(() => process.exit(1));
  }
}

