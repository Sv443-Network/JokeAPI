const packageJSON = require("./package.json");
const jsl = require("svjsl");
const col = jsl.colors.fg;
const bgc = jsl.colors.bg;

module.exports = {
    debug: {
        verboseLogging: false,     // set to true to enable extra debug output
        progressBarDisabled: true, // set to true to disable the progress bar - greatly improves readability of verbose debug output
    },
    info: {
        name: "JokeAPI",                                // the name of JokeAPI
        desc: packageJSON.description,                  // the description of JokeAPI
        projGitHub: "https://github.com/Sv443/JokeAPI", // URL to the project's GitHub page
        version: packageJSON.version,                   // the version as a string
        versionInt: packageJSON.version.split("."),     // the version as a number array
        docsURL: "https://sv443.net/jokeapi",           // the URL to the documentation of JokeAPI
        author: {
            name: packageJSON.author.name,      // author name
            email: packageJSON.author.email,    // author email
            website: packageJSON.author.url,    // author website
            github: "https://github.com/Sv443", // author github page
        },
        infoMsg: "If you want to be updated on the status of JokeAPI, please consider joining my Discord server (https://discord.gg/aBH4uRG)",
    },
    init: {
        initDirs: [ // directories that should be generated if they don't exist - paths relative to root of project - doesn't necessarily need trailing slash
            "./data",
            "./data/logs",
            "./data/lists",
            "./data/analytics",
            "./data/submissions",
        ],
    },
    logging: {
        logChar: "▌",                  // character that gets logged on each request
        spacerAfter: 10,               // after how many logged requests a spacer should be put - set to 0 to disable
        disableLogging: false,         // set to true to disable logging a character on each request
        blacklistLoggingEnabled: true, // whether or not to log the character when an IP is on the blacklist
    },
    wrapper: {
        mainFilePath: "./src/main.js",     // main script file
        logFilePath: "./data/wrapper.log", // wrapper log file
        skipWrapping: false,               // whether or not to skip the wrapping through node-wrap
        crashTimeout: 2000,                // big enough of a timeout to hopefully allow all possible hiccups to settle down before restarting
    },
    jokes: {
        jokesFormatVersion: 2,                               // current joke format version
        jokesFilePath: "./data/jokes.json",                  // path to the jokes file
        jokeSubmissionURL: "https://sv443.net/r/submitjoke", // joke submission url
        jokeSubmissionPath: "./data/submissions/",           // path to a directory where joke submissions should be saved to - needs trailing slash
        possible: {
            anyCategoryName: "Any", // the name of the "Any" category
            categories: [           // all categories (excluding "Any")
                "Miscellaneous",
                "Programming",
                "Dark",
            ],
            flags: [ // all flags
                "nsfw",
                "religious",
                "political",
                "racist",
            ],
            formats: [ // all formats
                "json",
                "xml",
                "yaml",
            ],
            types: [
                "single",
                "twopart"
            ],
        },
        fileFormatsPath: "./data/fileFormats.json", // path to the file formats file
        defaultFileFormat: {
            fileFormat: "json",           // the default file format string
            mimeType: "application/json", // the default file format mime type
        },
        lastIDsMaxLength: 10, // the maximum amount of joke IDs that get saved to the blacklist-array
    },
    httpServer: {
        port: 8079,         // http server port
        allowCORS: true,    // whether or not to allow Cross Origin Resource Sharing
        rateLimiting: 30,   // amount of allowed requests per below defined timeframe
        timeFrame: 1,       // timeframe in min - also supports floating point numbers
        urlPathOffset: 0,   // example: "sv443.net/jokeapi/info" with an offset of 1 will only start parsing the path beginning at "info"
        disableCache: true, // whether or not to disable the cache - default: true (setting to false may prevent the users from getting new jokes)
        infoHeaders: true,  // whether or not to add an informational header about JokeAPI to each request
        regexes: {          // regular expressions to validate IP addresses - thanks to https://nbviewer.jupyter.org/github/rasbt/python_reference/blob/master/tutorials/useful_regex.ipynb
            ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/gm,
            ipv6: /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/gm,
        },
        ipSanitization: { // used to sanitize IP addresses so they can be used in file paths
            regex: /[^A-Za-z0-9\-_./]|^COM[0-9]([/.]|$)|^LPT[0-9]([/.]|$)|^PRN([/.]|$)|^CLOCK\$([/.]|$)|^AUX([/.]|$)|^NUL([/.]|$)|^CON([/.]|$)/gm,
            replaceChar: "#", // what character to use instead of illegal characters
        },
    },
    errors: {
        errorRegistryIncludePath: "./data/errorRegistry", // path to the error registry
        errorLogDir: "./data/logs/",                      // path to the error log directory - needs trailing slash
    },
    lists: {
        blacklistPath: "./data/lists/ipBlacklist.json",             // path to the IP blacklist
        whitelistPath: "./data/lists/ipWhitelist.json",             // path to the IP whitelist
        consoleBlacklistPath: "./data/lists/consoleBlacklist.json", // path to the IP console blacklist
    },
    documentation: {
        dirPath: "./docs/",                // path to the documentation directory - needs trailing slash
        faviconPath: "./docs/favicon.ico", // path to the favicon.ico file - don't add trailing slash
        rawDirPath: "./docs/raw/",         // path to the raw documentation files directory - needs trailing slash
        daemonInterval: 2,                 // interval (in seconds) at which the daemon checks for changes in the documentation directory
        error404path: "./docs/err/404.html", // path to the 404 error page
        error500path: "./docs/err/500.html", // path to the 500 error page
        codeFontFileName: "CascadiaCode-Regular-VTT_1910.04.ttf", // the name of the font file that is going to be used in code blocks - has to be in the directory specified with the above property "dirPath"
    },
    endpoints: {
        dirPath: "./endpoints/", // path to the dir containing all the endpoint scripts
        ratelimitBlacklist: [    // calling an endpoint in this array will not count towards the rate limit counter
            "static",
        ],
    },
    colors: {
        success: col.green,     // when request was successful
        error: col.red,         // when request was errored
        ratelimit: col.magenta, // when request was rate limited
        docs: col.yellow,                             // when docs were requested
        blacklisted: bgc.red + col.yellow,            // when a request IP is blacklisted
        docsrecompiled: bgc.yellow + col.blue, // when the docs were recompiled
    },
    analytics: {
        dirPath: "./data/analytics/", // path to the analytics directory - needs trailing slash
    },
    searchFuzzy: {
        shouldSort: true,
        tokenize: true,
        threshold: 0.6,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
    },
}