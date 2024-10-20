import type { Stringifiable } from "@/types/index.js";
import "dotenv/config";

/**
 * Grabs an environment variable's value, and casts it to a `string` (or what's passed in the TRetVal generic).  
 * However if the string is empty (or unset), undefined is returned.
 */
export function getEnvVar<TRetVal extends string>(varName: string, asType?: "stringNoEmpty"): undefined | TRetVal
/** Grabs an environment variable's value, and casts it to a `string` (or what's passed in the TRetVal generic) */
export function getEnvVar<TRetVal extends string>(varName: string, asType?: "string"): undefined | TRetVal
/** Grabs an environment variable's value, and casts it to a `number` (or what's passed in the TRetVal generic) */
export function getEnvVar<TRetVal extends number>(varName: string, asType: "number"): undefined | TRetVal
/** Grabs an environment variable's value, and casts it to a `string[]` (or what's passed in the TRetVal generic) */
export function getEnvVar<TRetVal extends string[]>(varName: string, asType: "stringArray"): undefined | TRetVal
/** Grabs an environment variable's value, and casts it to a `number[]` (or what's passed in the TRetVal generic) */
export function getEnvVar<TRetVal extends number[]>(varName: string, asType: "numberArray"): undefined | TRetVal
/** Grabs an environment variable's value, and casts it to a specific type (stringNoEmpty by default) */
export function getEnvVar<
  T extends ("string" | "number" | "stringArray" | "numberArray" | "stringNoEmpty")
>(
  varName: string,
  asType: T = "stringNoEmpty" as T,
): undefined | (string | number | string[] | number[]) {
  const val = process.env[varName];

  if(!val)
    return undefined;

  let transform: (value: string) => unknown = v => v.trim();

  const commasRegex = /[,،，٫٬]/g;

  switch(asType) {
  case "number":
    transform = v => parseInt(v.trim());
    break;
  case "stringArray":
    transform = v => v.trim().split(commasRegex);
    break;
  case "numberArray":
    transform = v => v.split(commasRegex).map(n => parseInt(n.trim()));
    break;
  case "stringNoEmpty":
    transform = v => String(v).trim().length == 0 ? undefined : String(v).trim();
  }

  return transform(val) as string; // I'm lazy and ts is happy, so we can all be happy and pretend this doesn't exist
}

/**
 * Tests if the value of the environment variable {@linkcode varName} equals {@linkcode compareValue} casted to string.  
 * Set {@linkcode caseSensitive} to true to make the comparison case-sensitive.
 */
export function envVarEquals(varName: string, compareValue: Stringifiable, caseSensitive = false) {
  const envVal = (caseSensitive ? getEnvVar(varName) : getEnvVar(varName)?.toLowerCase());
  const compVal = (caseSensitive ? String(compareValue) : String(compareValue).toLowerCase());
  return envVal === compVal;
}
