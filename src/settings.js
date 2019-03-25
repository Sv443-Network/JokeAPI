module.exports = {
    version: "1.0.0",                                                  // Version of JokeAPI
    jokeSubmissionURL: "https://sv443.net/r/submitJoke",               // Joke submission form URL
    server: {
        port: 8079,                                                    // Port of HTTP listener
        allowCORS: true                                                // Whether CORS should be enabled
    },
    jokePath: "./data/jokes.json",                                     // JSON file which contains all jokes
    logPath: "./data/requests.log",                                    // request log file path
    logMaxLines: 220,
    docsFolder: "./data/docs",
    docsFiles: {
        HTML: "index.html",
        JS: "index.js",
        CSS: "index.css"
    },
    statsFilePath: "./data/debug/statistics.json",                     // statistics file path
    available_categories: ["Programming", "Miscellaneous", "Dark"],    // All available categories
    flags: ["nsfw", "religious", "political"]                          // All available flags
}