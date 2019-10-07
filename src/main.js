// The main coordination file of JokeAPI
// This file starts all necessary modules including the joke parser, the JokeAPI Documentation page injection and the HTTP listener

// External Packages:
const jsl = require("svjsl");
const dotenv = require("dotenv");

// JokeAPI Modules:
const settings = require("../settings");
const debug = require("./verboseLogging");
const parseJokes = require("./parseJokes");
const httpServer = require("./httpServer");
const lists = require("./lists");
const docs = require("./docs");

// Dependency / Package Setup:
const col = jsl.colors;
process.japi = {};
process.japi.debuggerActive = typeof v8debug === "object" || /--debug|--inspect/.test(process.execArgv.join(" "));
const noDbg = process.japi.debuggerActive || false;
dotenv.config();

// Other stuff:
console.log(`Init ${settings.info.name} (v${settings.info.version})`);
let pb;


//#MARKER init all
const initAll = () => {
    process.jokeapi = {};
    debug("Init", "Calling joke parser...");

    //#SECTION parse jokes
    if(!noDbg && !settings.debug.progressBarDisabled)
        pb = new jsl.ProgressBar(5, "Parsing Jokes...");
    parseJokes.init().then(() => {
        
        //#SECTION init lists
        if(!jsl.isEmpty(pb)) pb.next("Initializing lists...");
        lists.init().then(() => {

            //#SECTION init documentation page
            if(!jsl.isEmpty(pb)) pb.next("Initializing documentation...");
            docs.init().then(() => {

                //#SECTION init HTTP server
                if(!jsl.isEmpty(pb)) pb.next("Initializing HTTP listener...");
                httpServer.init().then(() => {  // <-DEBUG
                    if(!jsl.isEmpty(pb)) pb.next("...");

                }).catch(err => initError("initializing the HTTP server", err));
            }).catch(err => initError("initializing documentation", err));
        }).catch(err => initError("initializing the lists", err));
    }).catch(err => initError("parsing jokes", err));
};


/**
 * This function gets called when JokeAPI encounters an error while initializing.
 * Because the initialization phase is such a delicate and important process, JokeAPI shuts down if an error is encountered.
 * @param {String} action 
 * @param {Error} err 
 */
const initError = (action, err) => {
    console.log(`\n\n\n${col.fg.red}JokeAPI encountered an error while ${action}:\n${err}\n\n${col.rst}`);
    process.exit(1);
}


initAll();