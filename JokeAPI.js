// 🔹 JokeAPI by Sv443 🔹
//
// GitHub:    https://github.com/Sv443/JokeAPI
// API Docs:  https://jokeapi.dev/
// ️
// ⚠️ Please read the LICENSE.txt file before modifying, redistributing or even selling JokeAPI.
// ⚠️ Thanks :)


const requireUncached = require("require-uncached");
const { randomItem, system } = require("svcorelib");

const wrap = require("node-wrap");

const settings = require("./settings");


/**
 * Splash texts :)
 */
const splashes = [
    "Beeping and booping...",
    `Preparing to overthrow huma- start up ${settings.info.name}`,
    "🤖",
    "Eradicating all the bugs...",
    "Removing unfunny jokes...",
    "Downloading documentation font 'Comic Sans MS'...",
    `It is${new Date().getDay() === 3 ? " " : " not "}wednesday, my dude`
]


/**
 * Initializes JokeAPI :)
 * @returns {void}
 */
function initJokeAPI()
{
    applyPadding();

    splash();

    if(!system.inDebugger() && !settings.wrapper.skipWrapping)
    {
        // the debugger and child processes don't get along together so only wrap JokeAPI if the debugger is not active:
        wrap(settings.wrapper.mainFilePath, settings.wrapper.wrapperSettings);
        return;
    }
    else
    {
        // load in main script file, which is the entrypoint to and initializer of everything in JokeAPI
        // requireUncached to make sure JokeAPI always re-fetches this file instead of loading from cache
        requireUncached(settings.wrapper.mainFilePath);
        return;
    }
}

/**
 * Applies some padding at startup and shutdown, just for the looks :)
 */
function applyPadding()
{
    if(settings.debug.verboseLogging)
    {
        console.log("\n\n");

        settings.init.exitSignals.forEach(sig => process.on(sig, () => console.log("\n")));
    }
}

/**
 * Add some fun text :)
 */
function splash()
{
    console.log(`${randomItem(splashes)}\n`);
}

initJokeAPI();
