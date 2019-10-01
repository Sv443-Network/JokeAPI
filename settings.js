const packageJSON = require("./package.json");

module.exports = {
    debug: {
        verboseLogging: true
    },
    info: {
        name: "JokeAPI",
        version: packageJSON.version,
        versionInt: packageJSON.version.split("."),
        author: {
            name: "Sv443",
            email: "sven.fehler@web.de",
            website: "https://sv443.net/",
            github: "https://github.com/Sv443"
        },
        contributors: [

        ]
    },
    wrapper: {
        mainFilePath: "./src/main.js",
        logFilePath: "./data/wrapper.log",
        skipWrapping: false
    },
    jokes: {
        jokesFilePath: "./data/jokes.json",
        jokeSubmissionURL: "https://sv443.net/r/submitjoke",
        possible: {
            categories: [
                "Miscellaneous",
                "Programming",
                "Dark"
            ],
            flags: [
                "nsfw",
                "religious",
                "political"
            ]
        }
    },
    httpServer: {
        port: 8079,
        allowCORS: true,
        rateLimiting: 30,
        timeFrame: 1 // in min
    }
}