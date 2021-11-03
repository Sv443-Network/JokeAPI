const dotenv = require("dotenv");

const { colors } = require("svcorelib");

const col = colors.fg;

/** @typedef {import("./types/env").Env} Env */
/** @typedef {import("./types/env").EnvDependentProp} EnvDependentProp */


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
 * Grabs an environment dependent property
 * @param {EnvDependentProp} prop
 * @returns {any}
 * @throws Exits with code 1 if property
 */
function getProp(prop)
{
    const deplEnv = getEnv();

    try
    {
        return envSettings[deplEnv][prop];
    }
    catch(err)
    {
        throw new Error(`Couldn't read env-dependent property '${prop}'${!initialized ? " - env module couldn't be initialized" : ""}`);
    }
}


module.exports = { init, getEnv, getProp };
