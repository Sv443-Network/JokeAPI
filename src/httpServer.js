// this module starts the HTTP server, parses the request and calls the requested endpoint

const jsl = require("svjsl");
const http = require("http");
const rateLimit = require("http-ratelimit");

const settings = require("../settings");
const debug = require("./verboseLogging");
const convertFileFormat = require("./fileFormatConverter");
const parseURL = require("./parseURL");


const init = () => {
    return new Promise((resolve, reject) => {
        let httpServer = http.createServer((req, res) => {
            let parsedURL = parseURL(req.url);
            let fileFormat = !jsl.isEmpty(parsedURL.queryParams) && !jsl.isEmpty(parsedURL.queryParams.format) ? parseURL.getFileFormatFromQString(parsedURL.queryParams) : settings.jokes.defaultFileFormat.fileFormat;

            try
            {
                rateLimit.inboundRequest(req);

                debug("HTTP", `URL obj is: ${JSON.stringify(parsedURL, null, 4)}`);

                if(rateLimit.isRateLimited(req, settings.httpServer.rateLimiting))
                {
                    res.writeHead(429, {"Content-Type": parseURL.getMimeTypeFromFileFormatString(fileFormat)});
                    res.end(convertFileFormat.auto(fileFormat, {
                        "error": true,
                        "internalError": false,
                        "code": 101,
                        "message": "Request blocked by rate limiting",
                        "causedBy": [
                            `You have sent too many requests. The limit is ${settings.httpServer.rateLimiting} requests within ${settings.httpServer.timeFrame} ${settings.httpServer.timeFrame == 1 ? "minute" : "minutes"}.\nIf you need more requests per minute, please contact me and we can figure things out: https://sv443.net/`
                        ]
                    }));
                }
            }
            catch(err)
            {
                let fileFormat = !jsl.isEmpty(parsedURL.queryParams) && !jsl.isEmpty(parsedURL.queryParams.format) ? parseURL.getFileFormatFromQString(parsedURL.queryParams) : settings.jokes.defaultFileFormat.fileFormat;

                res.writeHead(500, {"Content-Type": parseURL.getMimeTypeFromFileFormatString(fileFormat)})
                res.end(convertFileFormat.auto(fileFormat, {
                    "error": true,
                    "internalError": true,
                    "code": 100,
                    "message": "",
                    "causedBy": [
                        `An error in the code - please contact me through one of the options on my website (https://sv443.net) and provide the following error message:\n${err}`
                    ]
                }));
            }
        });

        httpServer.listen(settings.httpServer.port, settings.httpServer.hostname, err => {
            if(!err)
            {
                rateLimit.init(settings.httpServer.timeFrame, true);
                debug("HTTP", `${jsl.colors.fg.green}HTTP Server successfully listens on port ${settings.httpServer.port}${jsl.colors.rst}`);
                return resolve();
            }
            else
            {
                debug("HTTP", `${jsl.colors.fg.red}HTTP listener init encountered error: ${settings.httpServer.port}${jsl.colors.rst}`);
                return reject(err);
            }
        });
    
        httpServer.on("error", err => {
            jsl.unused(err); // TODO: handle error
        });
    });
}

// const incomingRequest = () => {

// }

module.exports = { init }