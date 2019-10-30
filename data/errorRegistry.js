const settings = require("../settings");

module.exports = {
    //#MARKER Class 1xx (HTTP)
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
        "errorMessage": "Disreputable IP address",
        "causedBy": [
            `${settings.info.name} has found your IP address to be disreputable and added it to the blacklist.\nThis is probably because you have shown malicious behavior like an attempted interruption of ${settings.info.name}'s service.\n\nIf you believe this was done in error, please contact me (${settings.info.author.website}) so we can sort things out.`
        ]
    }
    //#MARKER Class 2xx
}