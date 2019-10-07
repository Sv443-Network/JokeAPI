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
                    // TODO: analytics.rateLimited(req);
                    return respondWithError(res, 429, 101, fileFormat);
                }
            }
            catch(err)
            {
                let fileFormat = !jsl.isEmpty(parsedURL.queryParams) && !jsl.isEmpty(parsedURL.queryParams.format) ? parseURL.getFileFormatFromQString(parsedURL.queryParams) : settings.jokes.defaultFileFormat.fileFormat;
                // TODO: analytics.internalError("HTTP", err);
                return respondWithError(res, 500, 100, fileFormat, err);
            }

            //#SECTION GET
            if(req.method === "GET")
            {
                jsl.unused(); //TODO: all of this shit
            }
            //#SECTION PUT
            else if(req.method === "PUT")
            {
                let data = "";
                req.on("data", chunk => {
                    data += chunk;

                    if(data == process.env.RESTART_TOKEN)
                        process.exit(2); // if the process is exited with status 2, the package node-wrap will restart the process
                });
            }
            //#SECTION HEAD / OPTIONS
            else if(req.method === "HEAD" || req.method === "OPTIONS")
            {
                //TODO: all of this shit
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

/**
 * Ends the request with an error. This error gets pulled from the error registry
 * @param {http.ServerResponse} res 
 * @param {Number} errorCode The error code
 * @param {Number} responseCode The HTTP response code to end the request with
 * @param {String} fileFormat The file format to respond with - automatically gets converted to MIME type
 * @param {String} errorMessage Additional error info
 */
const respondWithError = (res, errorCode, responseCode, fileFormat, errorMessage) => {
    try
    {
        let errFromRegistry = require(settings.errors.errorRegistryIncludePath)[errorCode.toString()];

        let errObj = {
            "error": true,
            "internalError": errFromRegistry.errorInternal,
            "code": errorCode,
            "message": errFromRegistry.errorMessage,
            "causedBy": errFromRegistry.causedBy
        }

        if(!jsl.isEmpty(errorMessage))
            errObj.additionalInfo = errorMessage;

        res.writeHead(responseCode, {"Content-Type": parseURL.getMimeTypeFromFileFormatString(fileFormat)})
        res.end(convertFileFormat.auto(fileFormat, errObj));
    }
    catch(err)
    {
        res.writeHead(responseCode, {"Content-Type": "text/plain"});
        res.end(`Internal error while sending error message.\nOh, the irony...\nPlease contact me (${settings.info.author.website}) and provide this additional info:\n${err}`);
    }
};

module.exports = { init, respondWithError }