const dotenv = require("dotenv");
const { colors } = require("svcorelib");
const { getLastCommit } = require("git-last-commit");

const col = colors.fg;

/** @typedef {import("./types/env").Env} Env */
/** @typedef {import("./types/env").CommitInfo} CommitInfo */
/** @typedef {import("./types/env").EnvDependentProp} EnvDependentProp */
/** @typedef {import("./types/env").EnvSettings} EnvSettings */


/** All environment-dependent settings */
const envSettings = Object.freeze({
    prod: {
        name: "JokeAPI",
        httpPort: 8076,
        baseUrl: "https://v2.jokeapi.dev",
        debug: false,
    },
    stage: {
        name: "JokeAPI_ST",
        httpPort: 8075,
        baseUrl: "https://stage.jokeapi.dev",
        debug: true,
    },
});

let initialized = false;


/**
 * Initializes the environment module
 */
function init()
{
    if(initialized)
        return;

    dotenv.config();
    initialized = true;
}

/**
 * Normalizes the environment passed as the env var `NODE_ENV` and returns it
 * @param {boolean} [colored=false] Set to `true` to color in the predefined env colors
 * @returns {Env}
 */
function getEnv(colored = false)
{
    if(!initialized)
        init();

    if(!process.env)
        throw new Error("no process environment found, please make sure a NODE_ENV variable is defined");

    const nodeEnv = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : null;


    /** @type {Env} */
    let env = "stage";
    
    if(nodeEnv === "prod" || nodeEnv === "production")
        env = "prod";

    const envCol = env === "prod" ? col.green : col.cyan;

    return colored === true ? `${envCol}${env}${col.rst}` : env;
}

/**
 * Checks if a passed value is a valid environment
 * @param {any} env
 * @returns {boolean}
 */
function isValidEnv(env)
{
    return ["stage", "prod"].includes(env);
}

/**
 * Grabs an environment dependent property
 * @param {EnvDependentProp} prop
 * @param {Env} [overrideEnv] Set to `prod` or `stage` to override the current env when resolving the property
 * @returns {EnvSettings[prop]}
 * @throws Exits with code 1 if property doesn't exist or the module couldn't be initialized
 */
function getProp(prop, overrideEnv)
{
    try
    {
        const env = isValidEnv(overrideEnv) ? overrideEnv : getEnv();

        return envSettings[env][prop];
    }
    catch(err)
    {
        throw new Error(`Couldn't read env-dependent property '${prop}'${!initialized ? " - env module couldn't be initialized" : ""}`);
    }
}

//#SECTION git

/**
 * Resolves with some info about the latest git commit on the current branch
 * @returns {Promise<CommitInfo, Error>}
 */
function getCommit()
{
    return new Promise(async (res, rej) => {
        try
        {
            getLastCommit((err, commit) => {
                if(err)
                    return rej(err instanceof Error ? err : new Error(err));

                return res(commit);
            });
        }
        catch(err)
        {
            const e = new Error(`Couldn't get commit info: ${err.message}`).stack += err.stack;
            return rej(e);
        }
    });
}


module.exports = { init, getEnv, getProp, getCommit };
