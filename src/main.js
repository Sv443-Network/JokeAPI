// The main coordination file of JokeAPI
// This file starts all necessary modules like the joke parser, the JokeAPI Documentation page injection and the HTTP listener, etc.

"use strict";


const jsl = require("svjsl");
const fs = require("fs-extra");
require("dotenv").config();

const settings = require("../settings");
const debug = require("./verboseLogging");
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
const promiseAllSequential = require("promise-all-sequential");

const col = jsl.colors.fg;
process.debuggerActive = jsl.inDebugger();
const noDbg = process.debuggerActive || false;

settings.init.exitSignals.forEach(sig => {
    process.on(sig, () => softExit(0));
});

//#MARKER init all
const initAll = () => {
    let initTimestamp = new Date().getTime();
    debug("Init", "Initializing all modules - calling joke parser...");
    
    process.jokeapi = {};
    initializeDirs();

    let initPromises = [];
    let initStages = [
        {
            name: "Initializing languages",
            fn: languages.init
        },
        {
            name: "Initializing translations",
            fn: translate.init
        },
        {
            name: "Initializing joke parser",
            fn: parseJokes.init
        },
        {
            name: "Initializing lists",
            fn: lists.init
        },
        {
            name: "Initializing documentation",
            fn: docs.init
        },
        {
            name: "Initializing Authorization module",
            fn: auth.init
        },
        {
            name: "Initializing HTTP listener",
            fn: httpServer.init
        },
        {
            name: "Initializing analytics module",
            fn: analytics.init
        }
    ];

    let pb;
    if(!noDbg && !settings.debug.progressBarDisabled)
        pb = new jsl.ProgressBar(initStages.length, initStages[0].name);

    initStages.forEach(stage => {
        initPromises.push(stage.fn);
    });

    meter.init();

    promiseAllSequential(initPromises).then((res) => {
        jsl.unused(res);

        if(!jsl.isEmpty(pb))
            pb.next("Done.");

        logRequest.initMsg(initTimestamp);
    }).catch(err => {
        initError("initializing", err);
    });
};


//#MARKER other

/**
 * This function gets called when JokeAPI encounters an error while initializing.
 * Because the initialization phase is such a delicate and important process, JokeAPI shuts down if an error is encountered.
 * @param {String} action 
 * @param {Error} err 
 */
const initError = (action, err) => {
    console.log(`\n\n\n${col.red}JokeAPI encountered an error while ${action}:\n${err}\n\n${jsl.colors.rst}`);
    process.exit(1);
}

/**
 * Makes sure all directories exist and creates them if they don't
 */
const initializeDirs = () => {
    try
    {
        settings.init.initDirs.forEach(dir => {
            if(!fs.existsSync(dir))
            {
                debug("InitDirs", `Dir "${dir}" doesn't exist, creating it...`);
                fs.mkdirSync(dir);
            }
        });
    }
    catch(err)
    {
        initError("initializing default directories", err);
    }
}

/**
 * Ends all open connections and then shuts down the process with the specified exit code
 * @param {Number} code 
 */
const softExit = code => {
    analytics.endSqlConnection().then(() => process.exit(code)).catch(() => process.exit(code));
}


module.exports = { softExit };
initAll();
