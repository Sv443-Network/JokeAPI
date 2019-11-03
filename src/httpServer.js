// this module starts the HTTP server, parses the request and calls the requested endpoint

const jsl = require("svjsl");
const UNUSED = jsl.unused;
const http = require("http");
const rateLimit = require("http-ratelimit");
const Readable = require("stream").Readable;
const fs = require("fs");

const settings = require("../settings");
const debug = require("./verboseLogging");
const resolveIP = require("./resolveIP");
const logger = require("./logger");
const logRequest = require("./logRequest");
const convertFileFormat = require("./fileFormatConverter");
const parseURL = require("./parseURL");
const lists = require("./lists");
const analytics = require("./analytics");
const parseJokes = require("./parseJokes");

const init = () => {
    debug("HTTP", "Starting HTTP server...");
    return new Promise((resolve, reject) => {
        let endpoints = [];

        /**
         * Initializes the HTTP server - can only be called once
         */
        let initHttpServer = () => {
            let httpServer = http.createServer((req, res) => {
                let parsedURL = parseURL(req.url);
                let ip = resolveIP(req);
                
                let fileFormat = settings.jokes.defaultFileFormat.fileFormat;
                if(!jsl.isEmpty(parsedURL.queryParams) && !jsl.isEmpty(parsedURL.queryParams.format))
                    fileFormat = parseURL.getFileFormatFromQString(parsedURL.queryParams);

                try
                {
                    if(lists.isBlacklisted(ip))
                    {
                        logRequest("blacklisted");
                        return respondWithError(res, 103, 403, fileFormat);
                    }

                    rateLimit.inboundRequest(req);

                    debug("HTTP", `URL obj is:\n${JSON.stringify(parsedURL, null, 4)}`);

                    if(settings.httpServer.allowCORS)
                    {
                        try
                        {
                            res.setHeader("Access-Control-Allow-Origin", "*");
                            res.setHeader("Access-Control-Request-Method", "GET");
                            res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
                            res.setHeader("Access-Control-Allow-Headers", "*");
                        }
                        catch(err)
                        {
                            console.log(`${jsl.colors.fg.red}Error while setting up CORS headers: ${err}${jsl.colors.rst}`);
                        }
                    }

                    res.setHeader("Allow", "GET, HEAD, OPTIONS");

                    if(settings.httpServer.disableCache)
                    {
                        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                        res.setHeader("Pragma", "no-cache");
                        res.setHeader("Expires", "0");
                    }

                    if(settings.httpServer.infoHeaders)
                    {
                        res.setHeader("API-Info", `${settings.info.name} v${settings.info.version} (${settings.info.docsURL})`);
                    }
                }
                catch(err)
                {
                    if(jsl.isEmpty(fileFormat))
                    {
                        fileFormat = settings.jokes.defaultFileFormat.fileFormat;
                        if(!jsl.isEmpty(parsedURL.queryParams) && !jsl.isEmpty(parsedURL.queryParams.format))
                            fileFormat = parseURL.getFileFormatFromQString(parsedURL.queryParams);
                    }

                    analytics.internalError("HTTP", err);
                    return respondWithError(res, 500, 100, fileFormat, err);
                }

                //#SECTION GET
                if(req.method === "GET")
                {
                    //TODO: all of this shit
                    
                    if(parsedURL.error === null)
                    {
                        let urlPath = parsedURL.pathArray;
                        let requestedEndpoint = "";
                        let lowerCaseEndpoints = [];
                        endpoints.forEach(ep => lowerCaseEndpoints.push(ep.name.toLowerCase()));

                        if(!jsl.isEmpty(urlPath))
                        {
                            for(let i = 0; i < urlPath.length; i++)
                            {
                                if(lowerCaseEndpoints.includes(urlPath[i]))
                                {
                                    requestedEndpoint = lowerCaseEndpoints[lowerCaseEndpoints.indexOf(urlPath[i])];
                                    break;
                                }
                            }
                        }
                        else
                        {
                            if(rateLimit.isRateLimited(req, settings.httpServer.rateLimiting))
                            {
                                analytics.rateLimited(ip);
                                logRequest("ratelimited");
                                return respondWithError(res, 101, 429, fileFormat);
                            }
                            else return serveDocumentation(res);
                        }

                        let foundEndpoint = false;
                        endpoints.forEach(ep => {
                            if(ep.name == requestedEndpoint)
                            {
                                foundEndpoint = true;
                                debug("HTTP-Request", `Got a request by ${ip}`);

                                let callEndpoint = require(`.${ep.absPath}`);
                                let meta = callEndpoint.meta;

                                if(jsl.isEmpty(meta) || (!jsl.isEmpty(meta) && meta.noLog !== true))
                                    logRequest("success");
                                
                                if(!jsl.isEmpty(meta) && meta.skipRateLimitCheck === true)
                                {
                                    try
                                    {
                                        return callEndpoint.call(req, res, parsedURL.pathArray, parsedURL.queryParams, fileFormat);
                                    }
                                    catch(err)
                                    {
                                        return respondWithError(res, 104, 500, fileFormat);
                                    }
                                }
                                else
                                {
                                    if(rateLimit.isRateLimited(req, settings.httpServer.rateLimiting))
                                    {
                                        analytics.rateLimited(ip);
                                        logRequest("ratelimited");
                                        return respondWithError(res, 101, 429, fileFormat);
                                    }
                                    else return callEndpoint.call(req, res, parsedURL.pathArray, parsedURL.queryParams, fileFormat);
                                }
                            }
                        });

                        if(!foundEndpoint)
                        {
                            if(!jsl.isEmpty(fileFormat))
                            {
                                // TODO: correct anchor
                                return respondWithError(res, 102, 404, fileFormat, `Endpoint "${!jsl.isEmpty(requestedEndpoint) ? requestedEndpoint : "/"}" not found - Please read the documentation at https://sv443.net/jokeapi#endpoints to see all available endpoints`);
                            }
                            else return respondWithErrorPage(req, res, 404, fileFormat, `Endpoint "${!jsl.isEmpty(requestedEndpoint) ? requestedEndpoint : "/"}" not found - Please read the documentation at https://sv443.net/jokeapi#endpoints to see all available endpoints`);
                        }
                    }
                }
                //#SECTION PUT
                else if(req.method === "PUT")
                {
                    // TODO: joke submissions

                    console.log(`PUT ${parsedURL.pathArray}`);
                    if(!jsl.isEmpty(parsedURL.pathArray) && parsedURL.pathArray[0] == "submit")
                    {
                        let data = "";
                        let dataGotten = false;
                        req.on("data", chunk => {
                            dataGotten = true;
                            data += chunk;
                            
                            try
                            {
                                let joke = JSON.parse(data);
                                if(jsl.isEmpty(joke))
                                    return respondWithError(res, 105, 400, fileFormat, "Request body is empty");
                                
                                if(joke.formatVersion == parseJokes.jokeFormatVersion && joke.formatVersion == settings.jokes.jokesFormatVersion)
                                {
                                    // format version is correct
                                }
                                else
                                {
                                    // TODO: respond with 400 - format version incorrect
                                }
                            }
                            catch(err)
                            {
                                return respondWithError(res, 105, 400, fileFormat, "Request format is not JSON");
                            }
                        });

                        setTimeout(() => {
                            !dataGotten && respondWithErrorPage(req, res, 400, fileFormat, "Request body is empty");
                        }, 3000);
                    }
                    else
                    {

                        let data = "";
                        let dataGotten = false;
                        req.on("data", chunk => {
                            data += chunk;
                            dataGotten = true;

                            if(data == process.env.RESTART_TOKEN)
                            {
                                res.writeHead(200, {"Content-Type": parseURL.getMimeTypeFromFileFormatString(fileFormat)});
                                res.end(convertFileFormat.auto(fileFormat, {
                                    "error": false,
                                    "message": `Restarted ${settings.info.name}`,
                                    "timestamp": new Date().getTime()
                                }));
                                console.log(`${logger.getTimestamp(" | ")} ${jsl.colors.fg.red}\n\nIP ${jsl.colors.fg.yellow}${ip}${jsl.colors.fg.red} sent a restart command\n${jsl.colors.rst}`);
                                process.exit(2); // if the process is exited with status 2, the package node-wrap will restart the process
                            }
                        });

                        setTimeout(() => {
                            !dataGotten && respondWithErrorPage(req, res, 404, fileFormat, "Not Found");
                        }, 3000);
                    }
                }
                //#SECTION HEAD / OPTIONS
                else if(req.method === "HEAD" || req.method === "OPTIONS")
                    serveDocumentation(res);
                //#SECTION invalid method
                else
                {
                    res.writeHead(405, {"Content-Type": parseURL.getMimeTypeFromFileFormatString(fileFormat)});
                    res.end(convertFileFormat.auto(fileFormat, {
                        "error": true,
                        "internalError": false,
                        "message": `Wrong method "${req.method}". Expected "GET", "OPTIONS" or "HEAD"`,
                        "timestamp": new Date().getTime()
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
                UNUSED(err); // TODO: handle error
            });
        };

        fs.readdir(settings.endpoints.dirPath, (err1, files) => {
            files.forEach(file => {
                let fileName = file.split(".");
                fileName.pop();
                fileName = fileName.length > 1 ? fileName.join(".") : fileName[0];

                let endpointFilePath = `${settings.endpoints.dirPath}${file}`;

                let stats = fs.statSync(endpointFilePath);
                if(stats.isFile())
                    endpoints.push({
                        name: fileName,
                        desc: require(`.${endpointFilePath}`).meta.desc, // needs an extra . cause require() is relative to this file, whereas "fs" is relative to the project root
                        absPath: endpointFilePath
                    });
            });

            //#MARKER call HTTP server init
            initHttpServer();
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
        let errFromRegistry = require(`.${settings.errors.errorRegistryIncludePath}`)[errorCode.toString()];
        let errObj = {};

        if(fileFormat != "xml")
        {
            errObj = {
                "error": true,
                "internalError": errFromRegistry.errorInternal,
                "code": errorCode,
                "message": errFromRegistry.errorMessage,
                "causedBy": errFromRegistry.causedBy
            }
        }
        else if(fileFormat == "xml")
        {
            errObj = {
                "error": true,
                "internalError": errFromRegistry.errorInternal,
                "code": errorCode,
                "message": errFromRegistry.errorMessage,
                "causedBy": {"cause": errFromRegistry.causedBy} // has to be like this so the conversion to XML looks better
            }
        }

        if(!jsl.isEmpty(errorMessage))
            errObj.additionalInfo = errorMessage;

        pipeString(res, convertFileFormat.auto(fileFormat, errObj), parseURL.getMimeTypeFromFileFormatString(fileFormat), responseCode);
    }
    catch(err)
    {
        let errMsg = `Internal error while sending error message.\nOh, the irony...\n\nPlease contact me (${settings.info.author.website}) and provide this additional info:\n${err}`;
        pipeString(res, errMsg, "text/plain", responseCode);
    }
};

/**
 * Responds with an error page (which one is based on the status code).
 * Defaults to 500
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res 
 * @param {(404|500)} statusCode 
 * @param {String} fileFormat
 * @param {String} error
 */
const respondWithErrorPage = (req, res, statusCode, fileFormat, error) => {
    jsl.unused([req, fileFormat]);

    if(isNaN(parseInt(statusCode)))
        return jsl.unused(); // TODO: handle error
    
    let filePath = "";

    switch(statusCode)
    {
        case 404:
            filePath = settings.documentation.error404path;
        break;
        case 500: default:
            filePath = settings.documentation.error500path;
        break;
    }

    res.setHeader("API-Error", error);

    pipeFile(res, filePath, "text/html", statusCode);
}

/**
 * Pipes a string into a HTTP response
 * @param {http.ServerResponse} res The HTTP res object
 * @param {String} text The response body
 * @param {String} mimeType The MIME type to respond with
 * @param {Number} [statusCode=200] The status code to respond with - defaults to 200
 */
const pipeString = (res, text, mimeType, statusCode = 200) => {
    try
    {
        statusCode = parseInt(statusCode);
        if(isNaN(statusCode)) throw new Error("");
    }
    catch(err)
    {
        res.writeHead(500, {"Content-Type": `text/plain; UTF-8`});
        res.end("INTERNAL_ERR:STATUS_CODE_NOT_INT");
        return;
    }

    let s = new Readable();
    s._read = () => {};
    s.push(text);
    s.push(null);

    res.writeHead(statusCode, {
        "Content-Type": `${mimeType}; UTF-8`,
        "Content-Length": text.length
    });

    s.pipe(res);
}

/**
 * Pipes a file into a HTTP response
 * @param {http.ServerResponse} res The HTTP res object
 * @param {String} filePath Path to the file to respond with
 * @param {String} mimeType The MIME type to respond with
 * @param {Number} [statusCode=200] The status code to respond with - defaults to 200
 */
const pipeFile = (res, filePath, mimeType, statusCode = 200) => {
    try
    {
        statusCode = parseInt(statusCode);
        if(isNaN(statusCode)) throw new Error("");
    }
    catch(err)
    {
        res.writeHead(500, {"Content-Type": `text/plain; UTF-8`});
        res.end("INTERNAL_ERR:STATUS_CODE_NOT_INT");
        return;
    }

    if(!fs.existsSync(filePath))
    {
        res.writeHead(500, {"Content-Type": `text/plain; UTF-8`});
        res.end("INTERNAL_ERR:NOT_FOUND");
        return;
    }

    let size = fs.statSync(filePath).size;

    try
    {
        res.writeHead(statusCode, {
            "Content-Type": `${mimeType}; UTF-8`,
            "Content-Length": size
        });

        let readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    }
    catch(err)
    {
        logger("fatal", err, true);
    }
}

/**
 * Serves the documentation page
 * @param {http.ServerResponse} res The HTTP res object
 */
const serveDocumentation = res => {
    logRequest("docs");
    return pipeFile(res, `${settings.documentation.dirPath}documentation.html`, "text/html", 200);
}

module.exports = { init, respondWithError, respondWithErrorPage, pipeString, pipeFile, serveDocumentation };