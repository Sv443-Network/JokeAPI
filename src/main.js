// The main coordination file of JokeAPI
// This file starts all necessary modules like the joke parser, the JokeAPI Documentation page injection and the HTTP listener, etc.

"use strict";


const jsl = require("svjsl");
const fs = require("fs");
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

const col = jsl.colors.fg;
process.debuggerActive = (typeof v8debug === "object" || /--debug|--inspect/.test(process.execArgv.join(" ")));
const noDbg = process.debuggerActive || false;

let pb;

settings.init.exitSignals.forEach(sig => {
    process.on(sig, () => softExit(0));
});

//#MARKER init all
const initAll = () => {
    let initTimestamp = new Date().getTime();
    debug("Init", "Initializing all modules - calling joke parser...");

    process.jokeapi = {};
    initializeDirs();

    //#SECTION parse jokes
    if(!noDbg && !settings.debug.progressBarDisabled)
        pb = new jsl.ProgressBar(6, "Parsing Jokes...");

    parseJokes.init().then(() => {
        
        //#SECTION init lists
        if(!jsl.isEmpty(pb)) pb.next("Initializing lists...");
        lists.init().then(() => {

            //#SECTION init documentation page
            if(!jsl.isEmpty(pb)) pb.next("Initializing documentation...");
            docs.init().then(() => {

                //#SECTION init auth
                if(!jsl.isEmpty(pb)) pb.next("Initializing Authorization module...");
                auth.init().then(() => {

                    //#SECTION init HTTP server
                    if(!jsl.isEmpty(pb)) pb.next("Initializing HTTP listener...");
                    httpServer.init().then(() => {

                        //#SECTION init analytics
                        if(!jsl.isEmpty(pb)) pb.next("Initializing analytics module...");
                        analytics.init().then(() => {
                            if(!jsl.isEmpty(pb)) pb.next("Done.");
                            logRequest.initMsg(initTimestamp);

                            // done.
                        }).catch(err => initError("initializing the analytics module", err));
                    }).catch(err => initError("initializing the HTTP server", err));
                }).catch(err => initError("initializing the Auth module", err));
            }).catch(err => initError("initializing documentation", err));
        }).catch(err => initError("initializing the lists", err));
    }).catch(err => initError("parsing jokes", err));
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