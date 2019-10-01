module.exports = {
    info: {
        name: "JokeAPI",
        version: "1.3.0",
        versionInt: [1, 3, 0],
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
        jokeSubmissionURL: "https://sv443.net/r/submitjoke"
    }
}