// 🔹 JokeAPI by Sv443 🔹
//
// GitHub:    https://github.com/Sv443/JokeAPI
// API Docs:  https://jokeapi.dev/
// ️
// ⚠️ Please read the LICENSE.txt file before modifying or redistributing JokeAPI.
// ⚠️ Thanks :)


const requireUncached = require("require-uncached");
const { randomItem, system, colors } = require("svcorelib");

const wrap = require("node-wrap");

const settings = require("./settings");


/**
 * Returns all splash texts :)
 * @returns {string[]}
 */
function getAllSplashTexts()
{
    // base / static splashes
    const splashes = [
        "Beeping and booping...",
        `Preparing to overthrow huma- start up ${settings.info.name}`,
        "🤖",
        "Eradicating all the bugs...",
        "Removing unfunny jokes...",
        "Downloading documentation font 'Comic Sans MS'...",
        "Smuggling jokes through the TCP port border patrol...",
        "A horse walks into a bar...",
        "Trans rights!"
    ];
    
    // dynamic splashes

    const now = new Date();
    
    if(now.getDay() === 3)
        splashes.push("It is wednesday, my dude 🐸");

    if((now.getMonth() + 1) === 6)
        splashes.push("🌈 Happy pride! 🌈");

    if(now.getDate() === 31 && (now.getMonth() + 1) === 12)
        splashes.push(`Fuck ${now.getFullYear()}`);

    if(now.getDate() === 14 && (now.getMonth() + 1) === 3)
        splashes.push("🍰");

    if(now.getDate() <= 19 && (now.getMonth() + 1) === 1 && now.getFullYear() === 2038)
        splashes.push(`ẗ̵̹́h̷̤͌e̸̱̾ ̶̩̓ë̷̖́n̶͉̈́d̵̥̾ ̷̤͆i̵̘̿s̸͚̚ ̴͉̒ṅ̴͕e̸̟͒a̸̭̚r̸͔͊`);

    return splashes;
}


/**
 * Initializes JokeAPI
 * @returns {void}
 */
function initJokeAPI()
{
    applyPadding();

    displaySplash();

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
 * Applies some padding at startup and shutdown, just for the looks
 */
function applyPadding()
{
    console.log("\n");

    settings.init.exitSignals.forEach(sig => {
        process.on(sig, () => console.log("\n"));
    });
}

/**
 * Add some fun text :)
 */
function displaySplash()
{
    const splashes = getAllSplashTexts();
    console.log(`${colors.fg.cyan}${randomItem(splashes)}${colors.rst}\n`);
}


// Run init function when this file is run
initJokeAPI();
