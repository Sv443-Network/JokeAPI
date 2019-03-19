require("node-wrap")("./index.js", {
    console: true,
    crashTimeout: 3000,
    logFile: "./data/wrapper.log",
    logTimestamp: true,
    restartOnCrash: true,
    restartTimeout: 0
});