const packageJSON = require("./package.json");
const jsl = require("svjsl");
const col = jsl.colors.fg;
const bgc = jsl.colors.bg;

const settings = {
    debug: {
        verboseLogging: true,      // set to true to enable extra debug output
        progressBarDisabled: true,  // set to true to disable the progress bar - greatly improves readability of verbose debug output
        onlyLogErrors: true,        // set to true to disable sending any console logs but error messages
    },
    info: {
        name: "JokeAPI",                                // the name of JokeAPI
        desc: packageJSON.description,                  // the description of JokeAPI
        projGitHub: "https://github.com/Sv443/JokeAPI", // URL to the project's GitHub page
        version: packageJSON.version,                   // the version as a string
        versionInt: packageJSON.version.split("."),     // the version as a number array
        docsURL: packageJSON.homepage,                  // the URL to the documentation of JokeAPI
        author: {
            name: packageJSON.author.name,   // author name
            email: packageJSON.author.email, // author email
            website: packageJSON.author.url, // author website
            github: `https://github.com/${packageJSON.author.name}`, // author github page
        },
        privacyPolicyUrl: "https://sv443.net/privacypolicy/en",
        contribGuideUrl: "https://github.com/Sv443/JokeAPI/blob/master/.github/Contributing.md",
    },
    wrapper: {
        mainFilePath: "./src/main.js",          // main script file
        skipWrapping: true,                    // whether or not to skip the wrapping through node-wrap
        wrapperSettings: {
            console: true,                      // whether Node-Wrap should log to the console
            crashTimeout: 2000,                 // timeout (in ms) until the process should be restarted after a crash
            logFile: "./data/logs/wrapper.log", // Node-Wrap log file
            logTimestamp: true,                 // whether to add a timestamp to the log
            restartOnCrash: true,               // whether to restart the process after a crash
            restartTimeout: 0,                  // timeout (in ms) until the process should be started again after a restart has been requested
        },
    },
    init: {
        initDirs: [ // directories that should be generated if they don't exist - paths relative to root of project - doesn't necessarily need trailing slash
            "./data/logs",
            "./data/submissions",
            "./docs/compiled",
            "./data/lists"
        ],
        exitSignals: [ // all signals that should cause a soft exit
            "SIGINT",
            "SIGTERM"
        ],
    },
    logging: {
        logChar: "▌",                  // character that gets logged on each request
        spacerAfter: 10,               // after how many logged requests a spacer should be put - set to 0 to disable
        disableLogging: false,         // set to true to disable logging a character on each request
        blacklistLoggingEnabled: true, // whether or not to log the character when an IP is on the blacklist
    },
    jokes: {
        jokesFormatVersion: 3,                               // current joke format version
        jokesFolderPath: "./data/jokes/",                    // path to the jokes folder - needs trailing slash
        jokeSubmissionURL: `${packageJSON.homepage}#submit`, // joke submission url
        jokeSubmissionPath: "./data/submissions/",           // path to a directory where joke submissions should be saved to - needs trailing slash
        submissions: {
            timeFrame: 60,                              // time frame of submission rate limiter (in seconds)
            rateLimiting: 3,                            // how many requests per timeframe should be allowed
            invalidCharRegex: /(?![\u0000-\u0fff])./gm, // eslint-disable-line no-control-regex
        },
        jokesTemplateFile: "template.json",  // relative to "jokes.jokesFolderPath"
        possible: {
            anyCategoryName: "Any", // the name of the "Any" category - readable name
            categories: [           // all categories (excluding "Any") - case insensitive / readable name
                "Misc",
                "Programming",
                "Dark",
                "Pun",
                "Spooky",
                "Christmas"
            ],
            categoryAliases: { // aliases of categories. Key gets auto-converted to value. Value has to be present in the "categories" array above!
                "Miscellaneous": "Misc",
                "Coding": "Programming",
                "Development": "Programming",
                "Halloween": "Spooky"
            },
            flags: [ // all flags - HAVE TO BE LOWER CASE!
                "nsfw",
                "religious",
                "political",
                "racist",
                "sexist",
                "explicit",
            ],
            formats: [ // all file formats - HAVE TO BE LOWER CASE!
                "json",
                "xml",
                "yaml",
                "txt",
            ],
            types: [ // all joke types - HAVE TO BE LOWER CASE!
                "single",
                "twopart"
            ],
        },
        fileFormatsPath: "./data/fileFormats.json", // path to the file formats file
        defaultFileFormat: {
            fileFormat: "json",           // the default file format string
            mimeType: "application/json", // the default file format mime type
        },
        lastIDsMaxLength: 15,          // the maximum amount of joke IDs that get saved to the blacklist-array
        jokeRandomizationAttempts: 25, // after how many attempts of selecting a random joke to stop trying
        splitChars: [",", "+", "-"],   // which characters should separate the values of parameters with support for multiple values
        splitCharRegex: /[,+-]/gm,     // which characters should separate the values of parameters with support for multiple values
        maxAmount: 10,                 // the maximum amount of jokes that can be fetched with a single call to the get jokes endpoint
        encodeAmount: 5,               // if more than this number of jokes is requested, encode them
    },
    httpServer: {
        port: 8076,           // http server port
        allowCORS: true,      // whether or not to allow Cross Origin Resource Sharing
        rateLimiting: 1000,     // amount of allowed requests per below defined timeframe
        timeFrame: 1,        // timeframe in seconds
        urlPathOffset: 0,     // example: "/jokeapi/info" with an offset of 1 will only start parsing the path beginning at "info" - an Apache reverse proxy will do this automatically though
        maxPayloadSize: 5120, // max size (in bytes) that will be accepted in a PUT request - if payload exceeds this size, it will abort with status 413
        maxUrlLength: 250,    // max amount of characters of the URL - if the URL is longer than this, the request will abort with status 414
        disableCache: true,   // whether or not to disable the cache - default: true (setting to false may prevent the users from getting new jokes)
        infoHeaders: true,    // whether or not to add an informational header about JokeAPI to each request
        reverseProxy: true,   // whether or not JokeAPI gets its requests from a reverse proxy
        ssl: {
            enabled: false,                // whether SSL is enabled
            certFile: "./.ssl/cert-xy.pem" // to be implemented (issue #185)
        },
        ipSanitization: {     // used to sanitize IP addresses so they can be used in file paths
            regex: /[^A-Za-z0-9\-_./]|^COM[0-9]([/.]|$)|^LPT[0-9]([/.]|$)|^PRN([/.]|$)|^CLOCK\$([/.]|$)|^AUX([/.]|$)|^NUL([/.]|$)|^CON([/.]|$)/gm,
            replaceChar: "#", // what character to use instead of illegal characters
        },
        ipHashing: {
            enabled: true,       // hashes all IP addresses. If set to false, JokeAPI is not GDPR compliant anymore!
            algorithm: "sha256", // the algorithm of the hash - available algorithms depend on the OpenSSL version installed on the machine (on linux can be listed with "openssl list -digest-algorithms")
            digest: "hex",       // the output format of the hash - can be "base64", "hex" or "latin1"
        },
        encodings: {
            gzip: true,    // Whether or not Gzip encoding should be enabled for the documentation page
            deflate: true, // Whether or not Deflate encoding should be enabled for the documentation page
            brotli: true,  // Whether or not Brotli encoding should be enabled for the documentation page
        },
        encodingPriority: [ // The priority of the encodings. Items with a lower array index (further to the left) have a higher priority
            "brotli", "gzip", "deflate"
        ],
    },
    errors: {
        errorLogDir: "./data/logs/",               // path to the error log directory - needs trailing slash
        errorMessagesPath: "./data/errorMessages", // path to error messages file
    },
    lists: {
        blacklistPath: "./data/lists/ipBlacklist.json",             // path to the IP blacklist
        whitelistPath: "./data/lists/ipWhitelist.json",             // path to the IP whitelist
        consoleBlacklistPath: "./data/lists/consoleBlacklist.json", // path to the IP console blacklist
    },
    documentation: {
        dirPath: "./docs/",                // path to the documentation directory - needs trailing slash
        compiledPath: "./docs/compiled/", // path to the compiled docs directory - needs trailing slash
        faviconPath: "./docs/static/favicon.ico", // path to the favicon.ico file - don't add trailing slash
        rawDirPath: "./docs/raw/",            // path to the raw documentation files directory - needs trailing slash
        daemonInterval: 2,                    // interval (in seconds) at which the daemon checks for changes in the documentation directory
        errorPagePath: "./docs/raw/errorPage.html", // path to the error page
        codeFontFileName: "static/external/CascadiaCode-Regular-VTT_1911.21.ttf", // the name of the font file that is going to be used in code blocks - has to be in the directory specified with the above property "dirPath"
        submissionForm: {
            dirPath: "./docs/raw/", // path to the submission form directory - needs trailing slash
            fileNames: {
                html: "submit.html", // name of the HTML file of the submission form - relative to the parameter "documentation.submissionForm.dirPath"
                js: "../static/submit.js", // name of the JS file of the submission form - relative to the parameter "documentation.submissionForm.dirPath"
                css: "../static/submit.css", // name of the CSS file of the submission form - relative to the parameter "documentation.submissionForm.dirPath"
            },
        },
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
        docs: col.yellow,                      // when docs were requested
        blacklisted: bgc.red + col.yellow,     // when a request IP is blacklisted
        docsrecompiled: bgc.yellow + col.blue, // when the docs were recompiled
    },
    analytics: {
        enabled: false, // whether or not the analytics module should be enabled
        dirPath: "./data/analytics/", // path to the analytics directory - needs trailing slash
        sqlTableName: "analytics",    // name of the SQL table
    },
    sql: { // (login credentials are set in the .env file)
        host: "localhost",   // IP address to the DB host - default for local device is "localhost"
        database: "jokeapi", // the name of the DB
        port: 3306,          // the port of the DB - default is 3306
    },
    auth: {
        tokenListFile: "./data/tokens.json", // path to the token list file
        tokenHeaderName: "authorization",     // the name of the token header (lower case)
        tokenValidHeader: "Token-Valid",     // the name of the token validity response header (normal case, not lower case)
        daemonInterval: 20, // after how many seconds the auth tokens should be refreshed
    },
    languages: {
        langFilePath: "./data/languages.json",        // file containing all language codes and corresponding language information
        defaultLanguage: "en",                        // default language (two character code, lowercase)
        translationsFile: "./data/translations.json", // translations file
    },
    tests: { // unit tests
        location: "./tests/",  // folder where unit tests are located - requires trailing slash
        initPingInterval: 250, // in ms - interval between init pings (default: 250)
    }
}

module.exports = Object.freeze(settings); // use Object.freeze() to prevent modifications at runtime
