const packageJSON = require("./package.json");

module.exports = {
    debug: {
        verboseLogging: true,      // set to true to enable extra debug output
        progressBarDisabled: true, // set to true to disable the progress bar - can improve readability of verbose debug output
    },
    info: {
        name: "JokeAPI",                            // the name of JokeAPI
        version: packageJSON.version,               // the version as a string
        versionInt: packageJSON.version.split("."), // the version as a number array
        author: {
            name: "Sv443",                      // author name
            email: "sven.fehler@web.de",        // author email
            website: "https://sv443.net/",      // author website
            github: "https://github.com/Sv443", // author github page
        },
        contributors: [
            // none yet :(
        ],
    },
    wrapper: {
        mainFilePath: "./src/main.js",     // main script file
        logFilePath: "./data/wrapper.log", // wrapper log file
        skipWrapping: false,               // whether or not to skip the wrapping through node-wrap
    },
    jokes: {
        jokesFilePath: "./data/jokes.json",                  // path to the jokes file
        jokeSubmissionURL: "https://sv443.net/r/submitjoke", // joke submission url
        possible: {
            categories: [        // all categories (excluding "Any")
                "Miscellaneous",
                "Programming",
                "Dark"
            ],
            flags: [             // all flags
                "nsfw",
                "religious",
                "political"
            ],
        },
        fileFormatsPath: "./data/fileFormats.json", // path to the file formats file
        defaultFileFormat: {
            fileFormat: "json",           // the default file format string
            mimeType: "application/json", // the default file format mime type
        },
    },
    httpServer: {
        port: 8079,       // http server port
        allowCORS: true,  // whether or not to allow Cross Origin Resource Sharing
        rateLimiting: 30, // amount of allowed requests per below defined timeframe
        timeFrame: 1,     // timeframe in min - also supports floating point numbers
    },
    errors: {
        errorRegistryIncludePath: "./data/errorRegistry", // path to the error registry
    },
    lists: {
        blacklistPath: "./data/lists/blacklist.json",               // path to the IP blacklist
        whitelistPath: "./data/lists/whitelist.json",               // path to the IP whitelist
        consoleBlacklistPath: "./data/lists/consoleBlacklist.json", // path to the IP console blacklist
    },
    documentation: {
        dirPath: "./docs/", // path to the documentation directory
        daemonInterval: 15, // interval (in seconds) at which the daemon checks for changes in the documentation directory
    },
}