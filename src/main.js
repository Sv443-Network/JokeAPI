// This is the entrypoint file of JokeAPI
// This file starts all necessary modules like the joke parser, the JokeAPI Documentation page injection and the HTTP listener

"use strict";


const { unused, filesystem, system, colors, ProgressBar } = require("svcorelib");
const promiseAllSequential = require("promise-all-sequential");

const debug = require("./debug");
const parseJokes = require("./parseJokes");
const httpServer = require("./httpServer");
const lists = require("./lists");
const docs = require("./docs");
const analytics = require("./analytics");
const logRequest = require("./logRequest");
const auth = require("./auth");
const languages = require("./languages");
const translate = require("./translate");
const meter = require("./meter");
const jokeCache = require("./jokeCache");
const parseURL = require("./parseURL");
const splashes = require("./splashes");

const settings = require("../settings");

const col = colors.fg;

/** Data that persists until JokeAPI is shut down */
const persistentData = {
    /** Whether the process is run in a debugger */
    debuggerActive: system.inDebugger() || false
};

require("dotenv").config();


settings.init.exitSignals.forEach(sig => {
    process.on(sig, () => softExit(0));
});


//#MARKER init all
/**
 * Main entrypoint of JokeAPI.  
 * This function loads in all "modules" and sequentially and asynchronously initializes them.
 */
async function initAll()
{
    const initTimestamp = Date.now();

    try
    {
        // ensure the directory structure JokeAPI requires exists (some dirs are in the .gitignore)
        await filesystem.ensureDirs(settings.init.initDirs);
    }
    catch(err)
    {
        return initError("creating directory structure", err);
    }

    const initPromises = [];

    /**
     * The different stages to JokeAPI's initialization.  
     * The stages are initialized sequentially, meaning the first item (index 0) will be initialized first, after it has finished the second item, and so on.
     */
    const initStages = [
        {
            name: "Languages module",
            fn: languages.init
        },
        {
            name: "Translations module",
            fn: translate.init
        },
        {
            name: "Splashes module",
            fn: splashes.init
        },
        {
            name: "Joke parser module",
            fn: parseJokes.init
        },
        {
            name: "Lists module",
            fn: lists.init
        },
        {
            name: "Documentation module",
            fn: docs.init
        },
        {
            name: "Authorization module",
            fn: auth.init
        },
        {
            name: "URL parser module",
            fn: parseURL.init
        },
        {
            name: "HTTP server module",
            fn: httpServer.init
        },
        {
            name: "Analytics module",
            fn: analytics.init
        },
        {
            name: "Joke cache module",
            fn: jokeCache.init
        },
        {
            name: "pm2 meter module",
            fn: meter.init
        }
    ];

    initStages.forEach(stage => initPromises.push(stage.fn));

    // create progress bar if the settings and debugger state allow it
    const pb = (!persistentData.debuggerActive && !settings.debug.progressBarDisabled) ? new ProgressBar(initStages.length, `Initializing ${initStages[0].name}`) : undefined;

    debug("Init", `Sequentially initializing all ${initStages.length} modules...`);

    try
    {
        // sequentially call all async `fn` properties of the `initStages` array and wait till they're all done
        const initRes = await promiseAllSequential(initPromises);

        // resolved values *can* be an object like this:
        /*

        {
            initTimeDeduction: number, // amount of milliseconds that should be deducted from the init time
        }

        */

        /** @type {number} Time that should be deducted from the init time */
        const initTimeDeduction = initRes.reduce((acc, r) => {
            return acc + ((r && typeof r.initTimeDeduction === "number" && !isNaN(r.initTimeDeduction)) ? r.initTimeDeduction : 0);
        });


        if(pb)
            pb.next(`Successfully initialized all ${initStages.length} modules`);

        debug("Init", `Successfully initialized all ${initStages.length} modules.`);

        logRequest.initMsg(initTimestamp, undefined, undefined, initTimeDeduction);
    }
    catch(err)
    {
        initError("initializing", err);
    }
}


//#MARKER other

/**
 * This function gets called when JokeAPI encounters an error while initializing.
 * Because the initialization phase is such a delicate and important process, JokeAPI shuts down if an error is encountered.
 * @param {String} action 
 * @param {Error} err 
 */
function initError(action, err)
{
    const errMsg = (err instanceof Error ? err.toString() : err) || "(No error message provided)";

    console.log(`\n\n${col.red}JokeAPI encountered an error while ${action}:\n${errMsg.toString()}\n\n${colors.rst}`);
    process.exit(1);
}

/**
 * Ends all open connections and then shuts down the process with the specified exit code
 * @param {Number} [code=0] Exit code - defaults to 0
 */
async function softExit(code = 0)
{
    try
    {
        code = parseInt(code);

        if(isNaN(code) || code < 0)
            code = 0;

        await analytics.endSqlConnection();

        process.exit(code);
    }
    catch(err)
    {
        unused(err);
        process.exit(code);
    }
}

// run initAll when this script file is executed
initAll();
