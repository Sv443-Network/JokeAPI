// The main coordination file of JokeAPI
// This file starts all necessary modules including the joke parser, the JokeAPI Documentation page injection and the HTTP listener


// External Packages:
const jsl = require("svjsl");
const dotenv = require("dotenv");

// JokeAPI Modules:
const settings = require("../settings");
const debug = require("./verboseLogging");
const parseJokes = require("./parseJokes");

// Dependency / Package Setup:
const col = jsl.colors;
process.japi = {};
process.japi.debuggerActive = typeof v8debug === "object" || /--debug|--inspect/.test(process.execArgv.join(" "));
const noDbg = !process.japi.debuggerActive || false;
dotenv.config();

// Other stuff:
console.log(`Init ${settings.info.name} (v${settings.info.version})`);
let pb;
if(!noDbg) pb = new jsl.ProgressBar(5, "Parsing Jokes...");


//#MARKER init all
const initAll = () => {
    debug("Init", "Calling joke parser");

    //#SECTION parse jokes
    parseJokes.init().then(() => {
        if(!noDbg) pb.next("");


    }).catch(err => initError("parsing jokes", err, "Parse Jokes"));
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