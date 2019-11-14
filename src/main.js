// The main coordination file of JokeAPI
// This file starts all necessary modules including the joke parser, the JokeAPI Documentation page injection and the HTTP listener

"use strict";


const jsl = require("svjsl");
const dotenv = require("dotenv");
const fs = require("fs");

const settings = require("../settings");
const debug = require("./verboseLogging");
const logger = require("./logger");
const parseJokes = require("./parseJokes");
const httpServer = require("./httpServer");
const lists = require("./lists");
const docs = require("./docs");
const logRequest = require("./logRequest");

const col = jsl.colors.fg;
process.japi = {};
process.japi.debuggerActive = typeof v8debug === "object" || /--debug|--inspect/.test(process.execArgv.join(" "));
const noDbg = process.japi.debuggerActive || false;
dotenv.config();


console.log(`\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n`);
console.log(`[${logger.getTimestamp(" | ")}] ${col.blue}${settings.info.name} v${settings.info.version}${jsl.colors.rst}`);
let pb;



//#MARKER init all
const initAll = () => {
    process.jokeapi = {};
    initializeDirs();

    debug("Init", "Calling joke parser...");

    //#SECTION parse jokes
    if(!noDbg && !settings.debug.progressBarDisabled)
        pb = new jsl.ProgressBar(4, "Parsing Jokes...");
    parseJokes.init().then(() => {
        
        //#SECTION init lists
        if(!jsl.isEmpty(pb)) pb.next("Initializing lists...");
        lists.init().then(() => {

            //#SECTION init documentation page
            if(!jsl.isEmpty(pb)) pb.next("Initializing documentation...");
            docs.init().then(() => {

                //#SECTION init HTTP server
                if(!jsl.isEmpty(pb)) pb.next("Initializing HTTP listener...");
                httpServer.init().then(() => {
                    if(!jsl.isEmpty(pb)) pb.next("Done.");

                    logRequest.initMsg();

                }).catch(err => initError("initializing the HTTP server", err));
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


initAll();