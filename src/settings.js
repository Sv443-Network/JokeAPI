module.exports = {
    version: "1.0.0",                                                  // version
    jokeSubmissionURL: "https://sv443.net/r/submitJoke",               // joke submission form URL
    server: {
        port: 8079,                                                    // port of HTTP listener
        allowCORS: true,                                               // Whether CORS should be enabled
        maxRequestsPerMinute: 20                                       // max requests from one IP address per minute
    },
    jokePath: "./data/jokes.json",                                     // JSON file which contains all jokes
    logPath: "./data/requests.log",                                    // request log file path
    logMaxLines: 220,                                                  // count of lines that will trigger a log deletion
    docsFolder: "./data/docs",                                         // where the documentation files are located at
    docsFiles: {
        HTML: "index.html",                                            // names of the docs' HTML file
        JS: "index.js",                                                // names of the docs' JS file
        CSS: "index.css"                                               // names of the docs' CSS file
    },
    statsFilePath: "./data/debug/statistics.json",                     // statistics file path
    available_categories: ["Programming", "Miscellaneous", "Dark"],    // all categories
    flags: ["nsfw", "religious", "political"]                          // all flags
}