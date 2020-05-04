const settings = require("../settings");

module.exports = {
    //#MARKER Class 1xx (HTTP)
    "100": {
        "errorInternal": true,
        "errorMessage": {
            "en": "Internal Error in HTTP Server",
            "de": "Interner Error im HTTP Server"
        },
        "causedBy": {
            "en": [
                `An error in the code - please contact me through one of the options on my website (${settings.info.author.website}) with the additional info.`
            ],
            "de": [
                `Ein Error im Quellcode - bitte kontaktiere mich durch eine der Möglichkeiten auf meiner Website (${settings.info.author.website}) mit den zusätzlichen Informationen.`
            ]
        }
    },
    "101": {
        "errorInternal": false,
        "errorMessage": {
            "en": "Request blocked by Rate Limiting",
            "de": "Anfrage blockiert durch Ratenbegrenzung"
        },
        "causedBy": {
            "en": [
                `You have sent too many requests too quickly. The limit is ${settings.httpServer.rateLimiting} requests within ${settings.httpServer.timeFrame} ${settings.httpServer.timeFrame == 1 ? "minute" : "minutes"}.\nIf you need more requests per minute, please contact me and we can try to figure things out: ${settings.info.author.website}`
            ],
            "de": [
                `Du hast zu viele Anfragen zu schnell gesendet. Das Limit ist ${settings.httpServer.rateLimiting} Anfragen innerhalb von ${settings.httpServer.timeFrame} ${settings.httpServer.timeFrame == 1 ? "Minute" : "Minuten"}.\nWenn du mehr Anfragen pro Minute brauchst, kontaktiere mich bitte, damit wir es klären können: ${settings.info.author.website}`
            ]
        }
    },
    "102": {
        "errorInternal": false,
        "errorMessage": {
            "en": "Requested Endpoint not found",
            "de": "Angefragten Endpunkt nicht gefunden"
        },
        "causedBy": {
            "en": "You sent a request to the wrong URL.",
            "de": "Du hast eine Anfrage an die falsche URL gesendet."
        }
    },
    "103": {
        "errorInternal": false,
        "errorMessage": {
            "en": "Disreputable IP Address",
            "de": "In schlechtem Ruf stehende IP Addresse"
        },
        "causedBy": {
            "en": `${settings.info.name} has found your IP address to be disreputable and added it to the blacklist.\nThis is probably because you have shown malicious behavior like an attempted interruption of ${settings.info.name}'s service.\n\nIf you believe this was done in error, please contact me (${settings.info.author.website}) so we can sort things out.`,
            "de": `${settings.info.name} ist aufgefallen, dass deine IP Addresse einen schlechten Ruf hat und hat sie in die Ignorierungsliste eingetragen.\nDas ist wahrscheinlich passiert, weil du böswilliges Verhalten gezeigt hast, wie beispielsweise eine Unterbrechung von ${settings.info.name}'s Betrieb.\n\nWenn du meinst, das wurde fälschlicherweise gemacht, bitte kontaktiere mich hier: (${settings.info.author.website}).`
        }
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
    },
    "106": {
        "errorInternal": false,
        "errorMessage": "No matching joke found",
        "causedBy": [
            "No jokes were found that match your provided filter(s)"
        ]
    },
    "107": {
        "errorInternal": false,
        "errorMessage": "Payload too large",
        "causedBy": [
            `The provided payload exceeds the limit of ${settings.httpServer.maxPayloadSize} bytes (${(settings.httpServer.maxPayloadSize / 1024).toFixed(1)} kB)`
        ]
    },
    "108": {
        "errorInternal": false,
        "errorMessage": "URI Too Long",
        "causedBy": [
            `The URL exceeds the maximum length of ${settings.httpServer.maxUrlLength} characters`
        ]
    }
    //#MARKER Class 2xx
}
