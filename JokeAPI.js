/**
 * @name JokeAPI
 * @author Sv443
 * @license MIT - https://sv443.net/LICENSE
 * 
 * Repository:     https://github.com/Sv443/JokeAPI
 * Documentation:  https://jokeapi.dev/
 * ️
 * ⚠️ Please read the LICENSE.txt file before modifying or redistributing any code
 * Thanks and have fun cringing at my code :)
 */
"use-strict";

const importFresh = require("import-fresh");
const { randomItem, system, colors } = require("svcorelib");

const settings = require("./settings");


/**
 * Initializes JokeAPI by wrapping, requiring or importing fresh, depending on settings and debugger environment
 */
function initJokeAPI()
{
    applyPadding();

    displaySplash();

    const inDebugger = system.inDebugger();

    if(inDebugger)
    {
        // debugger sometimes loses track when requiring uncached, so use the default require instead
        require(settings.init.mainFilePath);
        return;
    }
    else
    {
        // load in main script file, which is the entrypoint to and initializer of everything in JokeAPI
        // importFresh to make sure Node always re-fetches this file instead of loading from cache
        importFresh(settings.init.mainFilePath);
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
    const splashes = getInitSplashTexts();
    console.log(`${colors.fg.cyan}${randomItem(splashes)}${colors.rst}\n`);
}

/**
 * Returns all init splash texts.  
 * These are different from the ones defined in the file at `settings.languages.splashesFilePath`
 * @returns {string[]}
 */
function getInitSplashTexts()
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

    // wednesday
    if(now.getDay() === 3)
        splashes.push("It is wednesday, my dude 🐸");

    // pride month
    if((now.getMonth() + 1) === 6)
        splashes.push("🌈  Happy pride! 🌈");

    // new year's eve
    if(now.getDate() === 31 && (now.getMonth() + 1) === 12)
        splashes.push(`Fuck ${now.getFullYear()}`);

    // pi day
    if(now.getDate() === 14 && (now.getMonth() + 1) === 3)
        splashes.push("🍰");

    // unix time end
    if(now.getDate() <= 19 && (now.getMonth() + 1) === 1 && now.getFullYear() === 2038)
        splashes.push(`ẗ̵̹́h̷̤͌e̸̱̾ ̶̩̓ë̷̖́n̶͉̈́d̵̥̾ ̷̤͆i̵̘̿s̸͚̚ ̴͉̒ṅ̴͕e̸̟͒a̸̭̚r̸͔͊`);

    // JokeAPI's birthday :)
    if(now.getDate() === 19 && (now.getMonth() + 1) === 3)
        splashes.push(`Happy Birthday ${settings.info.name} :)`);

    return splashes;
}


// Run init function when this file is run
initJokeAPI();
