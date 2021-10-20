const dotenv = require("dotenv");

/** @typedef {import("svcorelib").JSONCompatible} JSONCompatible*/
/** @typedef {import("./types/env").Env} Env */
/** @typedef {import("./types/env").EnvDependentProp} EnvDependentProp */


/** All environment-dependent settings */
const envSettings = Object.freeze({
    prod: {
        name: "JokeAPI",
        httpPort: 8076,
        baseUrl: "https://v2.jokeapi.dev",
    },
    stage: {
        name: "JokeAPI_ST",
        httpPort: 8075,
        baseUrl: "https://stage.jokeapi.dev",
    },
});

let initialized = false;


/**
 * Initializes the deployment environment module
 */
function init()
{
    if(initialized)
        return;

    dotenv.config();
    initialized = true;
}

/**
 * Normalizes the deployment environment passed as the env var `NODE_ENV` and returns it
 * @returns {Env}
 */
function getEnv()
{
    if(!initialized)
        init();

    if(!process.env)
        return "stage";

    const nodeEnv = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : null;

    switch(nodeEnv)
    {
        case "prod":
        case "production":
            return "prod";
    }

    return "stage";
}

/**
 * 
 * @param {EnvDependentProp} prop
 * @returns {JSONCompatible}
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
        console.error(`Error while resolving environment-dependent settings property '${prop}' in current env '${deplEnv}':\n${err instanceof Error ? err.stack : err}`);
        process.exit(1);
    }
}


module.exports = { init, getEnv, getProp };
