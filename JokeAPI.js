// 🔹 JokeAPI v2 by Sv443 🔹
//
// GitHub:    https://github.com/Sv443/JokeAPI
// API Docs:  https://sv443.net/jokeapi/v2
// ️
// ⚠️ Please read the LICENSE.txt file before redistributing JokeAPI.
// ⚠️ I don't want to take legal action on anyone so please do me that favor.
// ⚠️ Thanks :)


const wrap = require("node-wrap");
const settings = require("./settings");

const debuggerActive = (typeof v8debug === "object" || /--debug|--inspect/.test(process.execArgv.join(" ")));



const initJokeAPI = () => {
    // the debugger and child processes don't get along together so only wrap JokeAPI if the debugger is not active:
    if(!debuggerActive && !settings.wrapper.skipWrapping)
    {
        return wrap(settings.wrapper.mainFilePath, {
            console: true,
            crashTimeout: settings.wrapper.crashTimeout,
            logFile: settings.wrapper.logFilePath,
            logTimestamp: true,
            restartOnCrash: true,
            restartTimeout: 0
        });
    }
    else return require(settings.wrapper.mainFilePath);
}

initJokeAPI();