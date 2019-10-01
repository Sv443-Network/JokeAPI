// 🔹 JokeAPI by Sv443 🔹
//
// GitHub:    https://github.com/Sv443/JokeAPI
// API Docs:  https://sv443.net/jokeapi
// ️
// ⚠️ Please read the LICENSE.txt file before distributing JokeAPI.
// ⚠️ I don't want to take legal action on anyone so please do me that favor.
// ⚠️ Thanks :)


const debuggerActive = typeof v8debug === "object" || /--debug|--inspect/.test(process.execArgv.join(" "));
require("dotenv").config();
const wrap = require("node-wrap");
const settings = require("./settings");
const fs = require("fs");


const initJokeAPI = () => {
    if(!fs.existsSync(settings.wrapper.logFilePath))
        fs.writeFileSync(settings.wrapper.logFilePath, "");

    // the debugger and child processes don't get along together so only wrap JokeAPI if the debugger is not active:
    if(!debuggerActive && !settings.wrapper.skipWrapping)
    {
        return wrap(settings.wrapper.mainFilePath, {
            console: true,
            crashTimeout: 0,
            logFile: settings.wrapper.logFilePath,
            logTimestamp: true,
            restartOnCrash: true,
            restartTimeout: 0
        });
    }
    else return require(settings.wrapper.mainFilePath);
}


initJokeAPI();