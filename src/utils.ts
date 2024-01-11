import { access, constants as fsconsts } from "node:fs/promises";
import k from "kleur";
import type { Stringifiable } from "svcorelib";
import "dotenv/config.js";
import { settings } from "./settings.js";
import { LogLevel } from "./types/misc.js";

/** Check if a file exists at the given path and is accessible with the given permissions. Checks for read and write perms by default. */
export async function exists(path: string, perms = fsconsts.R_OK | fsconsts.W_OK) {
  try {
    await access(path, perms);
    return true;
  }
  catch(e) {
    void e;
    return false;
  }
}

/** Logs the passed values to the console if the log level is set to debug or above */
export function logDebug(...args: Stringifiable[]) {
  if(settings.debug.logLevel <= LogLevel.Debug)
    console.log(k.magenta(`${getLogTime()}[DBG]`), ...args);
}

/** Logs the passed values to the console if the log level is set to info or above */
export function logInfo(...args: Stringifiable[]) {
  if(settings.debug.logLevel <= LogLevel.Info)
    console.log(k.cyan(`${getLogTime()}[INFO]`), ...args);
}

/** Logs the passed values to the console as a warning regardless of log level */
export function logWarn(...args: Stringifiable[]) {
  if(settings.debug.logLevel <= LogLevel.Warn)
    console.log(k.yellow(`${getLogTime()}[WARN]`), ...args);
}

/** Logs the passed values to the console as an error regardless of log level */
export function logError(...args: Stringifiable[]) {
  console.log("\n", k.red(`${getLogTime()}[ERROR]`), ...args, "\n");
}

function getLogTime() {
  if(!settings.debug.logTime)
    return "";
  return k.gray(`[${new Date().toLocaleString()}] `);
}

/** Tests if the environment variable `varName` equals `value` casted to string */
export function envVarEquals(varName: string, value: Stringifiable, caseSensitive = false)
{
  const envVal = process.env[varName];
  const val = String(value);
  return (caseSensitive ? envVal : envVal?.toLowerCase()) === (caseSensitive ? val : val.toLowerCase());
}

/** Grabs an environment variable's value, and casts it to a `string` */
export function getEnvVar(varName: string, asType?: "string"): undefined | string
/** Grabs an environment variable's value, and casts it to a `string` - however if the string is empty (unset), undefined is returned */
export function getEnvVar(varName: string, asType: "stringNoEmpty"): undefined | string
/** Grabs an environment variable's value, and casts it to a `string[]` */
export function getEnvVar(varName: string, asType: "stringArray"): undefined | string[]
/** Grabs an environment variable's value, and casts it to a `number` */
export function getEnvVar(varName: string, asType: "number"): undefined | number
/** Grabs an environment variable's value, and casts it to a `number` - however if the string is empty (unset), undefined is returned */
export function getEnvVar(varName: string, asType: "numberNoEmpty"): undefined | number
/** Grabs an environment variable's value, and casts it to a `number[]` */
export function getEnvVar(varName: string, asType: "numberArray"): undefined | number[]
/** Grabs an environment variable's value, and casts it to a `boolean` - defaults to false if empty or malformed */
export function getEnvVar(varName: string, asType: "boolDefaultFalse"): boolean | false
/** Grabs an environment variable's value, and casts it to a `boolean` - defaults to true if empty or malformed */
export function getEnvVar(varName: string, asType: "boolDefaultTrue"): boolean | true
/** Grabs an environment variable's value, and casts it to a specific type (default string) */
export function getEnvVar<
    T extends ("string" | "number" | "stringArray" | "numberArray" | "stringNoEmpty" | "numberNoEmpty" | "boolDefaultFalse" | "boolDefaultTrue")
>(
  varName: string,
  asType: T = "string" as T,
): undefined | (string | number | string[] | number[] | boolean) {
  const val = process.env[varName];

  let transform: (value: string | undefined) => unknown = v => v ? v.trim() : undefined;

  const commasRegex = /[.,،，٫٬]/g;

  switch(asType)
  {
  case "number":
    transform = v => Number(v);
    break;
  case "stringArray":
    transform = v => v ? v.trim().split(commasRegex) : undefined;
    break;
  case "numberArray":
    transform = v => v ? v.split(commasRegex).map(n => Number(n)) : undefined;
    break;
  case "stringNoEmpty":
    transform = v => v && v.trim().length < 1 ? undefined : (v ? v.trim() : undefined);
    break;
  case "numberNoEmpty":
    transform = v => v && v.trim().length < 1 || isNaN(Number(v))
      ? undefined
      : Number(v);
    break;
  case "boolDefaultFalse":
  case "boolDefaultTrue":
  {
    const defaultVal = asType === "boolDefaultTrue";
    transform = v => !v || String(v).trim().length === 0
      ? defaultVal
      : (
        String(v).trim().toLowerCase() === "true" ||
        (
          isNaN(Number(v))
            ? defaultVal
            : Number(v) === 1
        )
      );
    break;
  }
  }

  return transform(val) as string; // I'm lazy and TS is happy, so we can all be happy and pretend this doesn't exist
}
