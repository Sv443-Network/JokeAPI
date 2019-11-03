const settings = require("../settings");

module.exports = {
    //#MARKER Class 1xx (HTTP)
    "100": {
        "errorInternal": true,
        "errorMessage": "Internal Error in HTTP Server",
        "causedBy": [
            `An error in the code - please contact me through one of the options on my website (${settings.info.author.website}) with the additional info below.`
        ]
    },
    "101": {
        "errorInternal": false,
        "errorMessage": "Request Blocked by Rate Limiting",
        "causedBy": [
            `You have sent too many requests too quickly. The limit is ${settings.httpServer.rateLimiting} requests within ${settings.httpServer.timeFrame} ${settings.httpServer.timeFrame == 1 ? "minute" : "minutes"}.\nIf you need more requests per minute, please contact me and we can try to figure things out: ${settings.info.author.website}`
        ]
    },
    "102": {
        "errorInternal": false,
        "errorMessage": "Requested Endpoint not found",
        "causedBy": [
            "You sent a request to the wrong URL"
        ]
    },
    "103": {
        "errorInternal": false,
        "errorMessage": "Disreputable IP Address",
        "causedBy": [
            `${settings.info.name} has found your IP address to be disreputable and added it to the blacklist.\nThis is probably because you have shown malicious behavior like an attempted interruption of ${settings.info.name}'s service.\n\nIf you believe this was done in error, please contact me (${settings.info.author.website}) so we can sort things out.`
        ]
    },
    "104": {
        "errorInternal": true,
        "errorMessage": "Internal Error while calling Endpoint",
        "causedBy": [
            `An error in the code - please contact me through one of the options on my website (${settings.info.author.website}) with the additional info below.`
        ]
    },
    "105": {
        "errorInternal": false,
        "errorMessage": "Malformed Joke",
        "causedBy": [
            "This joke was formatted incorrectly."
        ]
    }
    //#MARKER Class 2xx
}