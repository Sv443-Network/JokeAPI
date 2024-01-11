import { readFileSync } from "node:fs";
import { getEnvVar } from "./utils.js";
import { LogLevel } from "./types/misc.js";

const packageJson = JSON.parse(String(readFileSync("./package.json")));

export const settings = {
  /** Info about the API */
  info: {
    name: `JokeAPI${getEnvVar("NAME_SUFFIX", "stringNoEmpty") ?? ""}`,
    version: packageJson.version as string,
    homepage: packageJson.homepage as string,
  },
  debug: {
    logLevel: getEnvVar("LOG_LEVEL", "numberNoEmpty") ?? LogLevel.Info,
    logTime: getEnvVar("LOG_TIME", "boolDefaultFalse"),
  },
  /** HTTP server settings */
  server: {
    /** hostname to bind to - default is 0.0.0.0 (listen on all interfaces) */
    hostname: "0.0.0.0",
    /** port for HTTP requests */
    port: getEnvVar("HTTP_PORT", "numberNoEmpty") ?? 8060,
    rateLimit: {
      points: 300,
      duration: 60 * 30,
    },
  },
};
