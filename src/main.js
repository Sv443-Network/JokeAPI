// This is the entrypoint file of JokeAPI
// This file starts all necessary modules like the joke parser, the JokeAPI Documentation page injection and the HTTP listener

"use strict";


const { unused, filesystem, system, colors, ProgressBar } = require("svcorelib");
const fs = require("fs-extra");
const promiseAllSequential = require("promise-all-sequential");

const settings = require("../settings");
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
const randomItem = require("svjsl/src/functions/randomItem");

const col = colors.fg;
process.debuggerActive = system.inDebugger();
const noDbg = process.debuggerActive || false;

require("dotenv").config();


settings.init.exitSignals.forEach(sig => {
    process.on(sig, () => softExit(0));
});


/**
 * An object describing all splash texts, sorted under each's language code
 * @typedef {object} SplashLangObj
 * @prop {string[]} de
 * @prop {string[]} en
 * @prop {string[]} etc
 */

/** @type {SplashLangObj} */
let splashes = {};
let splashDefaultLang = "en";

//#MARKER init all
/**
 * Main entrypoint of JokeAPI.  
 * This function loads in all "modules" and sequentially and asynchronously initializes them.
 */
async function initAll()
{
    const initTimestamp = Date.now();

    process.jokeapi = {};
    // initializeDirs();

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
     * The stages are initialized sequentially, meaning the lowest index will be called first, then the second lowest, and so on.
     */
    const initStages = [
        {
            name: "Languages",
            fn: languages.init
        },
        {
            name: "Translations",
            fn: translate.init
        },
        {
            name: "Joke parser",
            fn: parseJokes.init
        },
        {
            name: "Lists",
            fn: lists.init
        },
        {
            name: "Documentation",
            fn: docs.init
        },
        {
            name: "Authorization module",
            fn: auth.init
        },
        {
            name: "URL parser",
            fn: parseURL.init
        },
        {
            name: "HTTP server",
            fn: httpServer.init
        },
        {
            name: "Analytics module",
            fn: analytics.init
        },
        {
            name: "Joke Cache",
            fn: jokeCache.init
        },
        {
            name: "Pm2 meter",
            fn: meter.init
        }
    ];

    initStages.forEach(stage => initPromises.push(stage.fn));

    // load in splash texts :)
    splashes = await loadSplashes();

    // create progress bar if the settings and debugger state allow it
    const pb = (!noDbg && !settings.debug.progressBarDisabled) ? new ProgressBar(initStages.length, `Initializing ${initStages[0].name}`) : undefined;

    debug("Init", `Sequentially initializing all ${initStages.length} modules...`);

    try
    {
        // sequentially call all async `fn` properties of the `initStages` array and wait till they're all done
        await promiseAllSequential(initPromises);

        // //#DEBUG#
        // require("./jokeCache").cache.listEntries("eff8e7ca506627fe15dda5e0e512fcaad70b6d520f37cc76597fdb4f2d83a1a3", "de").then(res => {
        //     console.log(res);
        // }).catch(err => {
        //     console.error(`Err: ${err}`);
        // });
        // //#DEBUG# (it's just a hash of localhost, don't worry)

        if(pb)
            pb.next("Done.");

        debug("Init", `Successfully initialized all ${initStages.length} modules. Printing init message:\n`);

        logRequest.initMsg(initTimestamp);
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
    const errMsg = err.stack || err || "(No error message provided)";

    console.log(`\n\n\n${col.red}JokeAPI encountered an error while ${action}:\n${errMsg}\n\n${colors.rst}`);
    process.exit(1);
}

/**
 * Ends all open connections and then shuts down the process with the specified exit code
 * @param {Number} [code=0] Exit code - defaults to 0
 */
function softExit(code)
{
    try
    {
        if(typeof code != "number" || code < 0)
            code = 0;

        analytics.endSqlConnection().then(() => process.exit(code));
    }
    catch(err)
    {
        unused(err);
        process.exit(code);
    }
}

/**
 * Loads splashes and returns them
 * @returns {Promise<SplashLangObj>}
 */
function loadSplashes()
{
    return new Promise((res, rej) => {
        fs.readFile(settings.languages.splashesFilePath, (err, data) => {
            if(err)
                return rej(`Couldn't read splashes file '${settings.languages.splashesFilePath}' due to error: ${err}`);

            try
            {
                const splashesFile = JSON.parse(data.toString());

                splashDefaultLang = splashesFile.defaultLang;
                // const languages = splashesFile.languages;
                const splashObjs = splashesFile.splashes;

                /** @type {SplashLangObj} */
                const splashes = {};

                splashObjs.forEach(splashObj => {
                    Object.keys(splashObj).forEach(/**@type {"en"}*/langCode => {
                        if(!Array.isArray(splashes[langCode]))
                            splashes[langCode] = [];

                        const splashText = splashObj[langCode];
                        
                        splashes[langCode].push(splashText);
                    });
                });

                if(Object.keys(splashes).length > 0)
                    return res(splashes);
                else
                    return rej(`No splashes present in file '${settings.languages.splashesFilePath}'`);
            }
            catch(err)
            {
                return rej(`General error while loading splash texts: ${err}`);
            }
        });
    });
}

/**
 * Returns a random splash of the specified language
 * @param {string} lang
 */
function getSplash(lang)
{
    let splash = "missingno"; // lgtm[js/useless-assignment-to-local]
    const langSplashes = splashes[lang];

    if(langSplashes && langSplashes.length > 0)
        splash = randomItem(langSplashes);
    else
        splash = randomItem(splashes[splashDefaultLang]);

    return splash;
}


module.exports = { softExit, getSplash };


// run initAll when this script file is executed
initAll();
