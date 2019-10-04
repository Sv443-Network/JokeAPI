const settings = require("../settings");

module.exports = {
    //#MARKER Class 1xx
    "100": {
        "errorInternal": true,
        "errorMessage": "HTTP Module | Internal Error",
        "causedBy": [
            "An error in the code - please contact me through one of the options on my website (https://sv443.net) with the additional info below."
        ]
    },
    "101": {
        "errorInternal": false,
        "errorMessage": "Request Blocked by Rate Limiting",
        "causedBy": [
            `You have sent too many requests. The limit is ${settings.httpServer.rateLimiting} requests within ${settings.httpServer.timeFrame} ${settings.httpServer.timeFrame == 1 ? "minute" : "minutes"}.\nIf you need more requests per minute, please contact me and we can try to figure things out: ${settings.info.author.website}`
        ]
    }
    //#MARKER Class 2xx
}