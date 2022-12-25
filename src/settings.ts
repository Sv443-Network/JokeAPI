import { readFileSync } from "fs-extra";
import type { Stringifiable } from "svcorelib";

const packageJson = JSON.parse(String(readFileSync("./package.json")));

export const settings = {
    info: {
        name: "JokeAPI" + getEnvVar("NAME_SUFFIX", "stringNoEmpty") ?? "",
        version: packageJson.version as string,
        homepage: packageJson.homepage as string,
    },
    /** HTTP server settings */
    server: {
        /** hostname to bind to - default is 0.0.0.0 (listen on all interfaces) */
        hostname: "0.0.0.0",
        /** port for HTTP requests */
        port: getEnvVar("HTTP_PORT", "numberNoEmpty") ?? 8076,
        rateLimit: {
            points: 300,
            duration: 60 * 30,
        },
    },
};


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
/** Grabs an environment variable's value, and casts it to a specific type (default string) */
export function getEnvVar<
    T extends ("string" | "number" | "stringArray" | "numberArray" | "stringNoEmpty" | "numberNoEmpty")
>(
    varName: string,
    asType: T = "string" as T,
): undefined | (string | number | string[] | number[]) {
    const val = process.env[varName];

    if(!val)
        return undefined;

    let transform: (value: string) => unknown = v => v.trim();

    const commasRegex = /[.,،，٫٬]/g;

    switch(asType)
    {
    case "number":
        transform = v => Number(v);
        break;
    case "stringArray":
        transform = v => v.trim().split(commasRegex);
        break;
    case "numberArray":
        transform = v => v.split(commasRegex).map(n => Number(n));
        break;
    case "stringNoEmpty":
        transform = v => v.trim().length < 1 ? undefined : v.trim();
        break;
    case "numberNoEmpty":
        transform = v => v.trim().length < 1 || isNaN(Number(v))
            ? undefined
            : Number(v);
        break;
    }

    return transform(val) as string; // I'm lazy and ts is happy, so we can all be happy and pretend this doesn't exist
}
