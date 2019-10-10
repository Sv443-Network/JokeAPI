const packageJSON = require("./package.json");
const col = require("svjsl").colors;

module.exports = {
    debug: {
        verboseLogging: true,      // set to true to enable extra debug output
        progressBarDisabled: true, // set to true to disable the progress bar - can improve readability of verbose debug output
    },
    info: {
        name: "JokeAPI",                                // the name of JokeAPI
        desc: packageJSON.description,                  // the description of JokeAPI
        projGitHub: "https://github.com/Sv443/JokeAPI", // URL to the project's GitHub page
        version: packageJSON.version,                   // the version as a string
        versionInt: packageJSON.version.split("."),     // the version as a number array
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
        crashTimeout: 2000,                // big enough of a timeout to hopefully allow all possible hiccups to settle down before restarting
    },
    jokes: {
        jokesFilePath: "./data/jokes.json",                  // path to the jokes file
        jokeSubmissionURL: "https://sv443.net/r/submitjoke", // joke submission url
        possible: {
            anyCategoryName: "Any", // the name of the "Any" category
            categories: [           // all categories (excluding "Any")
                "Miscellaneous",
                "Programming",
                "Dark"
            ],
            flags: [                // all flags
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
        dirPath: "./docs/",        // path to the documentation directory - needs trailing slash
        rawDirPath: "./docs/raw/", // path to the raw documentation files directory - needs trailing slash
        daemonInterval: 15,        // interval (in seconds) at which the daemon checks for changes in the documentation directory
    },
    endpoints: {
        dirPath: "./endpoints/", // path to the dir containing all the endpoint scripts
        docsEndpoint: "docs",    // the name of the documentation endpoint
    },
    colors: {
        success: col.fg.green,  // when request successful
        error: col.fg.red,      // when request errored
        ratelimit: col.fg.pink, // when request rate limited
        docs: col.fg.yellow,    // when docs were requested
    }
}