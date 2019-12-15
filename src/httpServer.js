// This module starts the HTTP server, parses the request and calls the requested endpoint

const jsl = require("svjsl");
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
         * Initializes the HTTP server - should only be called once
         */
        let initHttpServer = () => {
            let httpServer = http.createServer((req, res) => {
                let parsedURL = parseURL(req.url);
                let ip = resolveIP(req);
                let analyticsObject = {
                    ipAddress: ip,
                    urlPath: parsedURL.pathArray,
                    urlParameters: parsedURL.queryParams
                };

                debug("HTTP", `Incoming request from "${ip}"`);
                
                let fileFormat = settings.jokes.defaultFileFormat.fileFormat;
                if(!jsl.isEmpty(parsedURL.queryParams) && !jsl.isEmpty(parsedURL.queryParams.format))
                    fileFormat = parseURL.getFileFormatFromQString(parsedURL.queryParams);

                try
                {
                    if(lists.isBlacklisted(ip))
                    {
                        logRequest("blacklisted", null, analyticsObject);
                        return respondWithError(res, 103, 403, fileFormat);
                    }

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

                    //analytics(); // TODO:
                    return respondWithError(res, 500, 100, fileFormat, err);
                }

                //#SECTION GET
                if(req.method === "GET")
                {
                    //#MARKER GET
                    if(parsedURL.error === null)
                    {
                        let urlPath = parsedURL.pathArray;
                        let requestedEndpoint = "";
                        let lowerCaseEndpoints = [];
                        endpoints.forEach(ep => lowerCaseEndpoints.push(ep.name.toLowerCase()));

                        if(!jsl.isEmpty(urlPath))
                        {
                            requestedEndpoint = urlPath[0];
                            // for(let i = 0; i < urlPath.length; i++)
                            // {
                            //     if(lowerCaseEndpoints.includes(urlPath[i]))
                            //     {
                            //         requestedEndpoint = lowerCaseEndpoints[lowerCaseEndpoints.indexOf(urlPath[i])];
                            //         break;
                            //     }
                            // }
                        }
                        else
                        {
                            if(rateLimit.isRateLimited(req, settings.httpServer.rateLimiting) && !lists.isWhitelisted(ip))
                            {
                                analytics.rateLimited(ip);
                                logRequest("ratelimited", null, analyticsObject);
                                return respondWithError(res, 101, 429, fileFormat);
                            }
                            /*DEBUG*/ else return respondWithErrorPage(req, res, 500, fileFormat, "ErrorMsg"); // eslint-disable-line
                            // else return serveDocumentation(res);
                        }

                        // Disable caching now that the request is not a docs request
                        if(settings.httpServer.disableCache)
                        {
                            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, no-transform");
                            res.setHeader("Pragma", "no-cache");
                            res.setHeader("Expires", "0");
                        }

                        // serve favicon:
                        if(!jsl.isEmpty(parsedURL.pathArray) && parsedURL.pathArray[0] == "favicon.ico")
                            return pipeFile(res, settings.documentation.faviconPath, "image/x-icon", 200);                       

                        let foundEndpoint = false;
                        endpoints.forEach(ep => {
                            if(ep.name == requestedEndpoint)
                            {
                                // now that the request is not a docs / favicon request, the blacklist is checked and the request is made eligible for rate limiting
                                if(!settings.endpoints.ratelimitBlacklist.includes(ep.name))
                                    rateLimit.inboundRequest(req);

                                foundEndpoint = true;

                                let callEndpoint = require(`.${ep.absPath}`);
                                let meta = callEndpoint.meta;
                                
                                if(!jsl.isEmpty(meta) && meta.skipRateLimitCheck === true)
                                {
                                    try
                                    {
                                        if(jsl.isEmpty(meta) || (!jsl.isEmpty(meta) && meta.noLog !== true))
                                            logRequest("success", null, analyticsObject);
                                        return callEndpoint.call(req, res, parsedURL.pathArray, parsedURL.queryParams, fileFormat);
                                    }
                                    catch(err)
                                    {
                                        return respondWithError(res, 104, 500, fileFormat);
                                    }
                                }
                                else
                                {
                                    if(rateLimit.isRateLimited(req, settings.httpServer.rateLimiting) && !lists.isWhitelisted(ip))
                                    {
                                        logRequest("ratelimited", null, analyticsObject);
                                        return respondWithError(res, 101, 429, fileFormat);
                                    }
                                    else
                                    {
                                        if(jsl.isEmpty(meta) || (!jsl.isEmpty(meta) && meta.noLog !== true))
                                            logRequest("success", null, analyticsObject);
                                        return callEndpoint.call(req, res, parsedURL.pathArray, parsedURL.queryParams, fileFormat);
                                    }
                                }
                            }
                        });

                        if(!foundEndpoint)
                        {
                            if(!jsl.isEmpty(fileFormat) && req.url.toLowerCase().includes("format"))
                            {
                                // TODO: correct anchor
                                return respondWithError(res, 102, 404, fileFormat, `Endpoint "${!jsl.isEmpty(requestedEndpoint) ? requestedEndpoint : "/"}" not found - Please read the documentation at ${settings.info.docsURL}#endpoints to see all available endpoints`);
                            }
                            else return respondWithErrorPage(req, res, 404, fileFormat, `Endpoint "${!jsl.isEmpty(requestedEndpoint) ? requestedEndpoint : "/"}" not found - Please read the documentation at ${settings.info.docsURL}#endpoints to see all available endpoints`);
                        }
                    }
                }
                //#SECTION PUT
                else if(req.method === "PUT")
                {
                    //#MARKER Joke submission
                    if(!jsl.isEmpty(parsedURL.pathArray) && parsedURL.pathArray[0] == "submit")
                    {
                        let data = "";
                        let dataGotten = false;
                        req.on("data", chunk => {
                            data += chunk;
                            
                            if(!jsl.isEmpty(data))
                                dataGotten = true;

                            try
                            {
                                let submittedJoke = JSON.parse(data);
                                if(jsl.isEmpty(submittedJoke))
                                    return respondWithError(res, 105, 400, fileFormat, "Request body is empty");
                                
                                if(submittedJoke.formatVersion == parseJokes.jokeFormatVersion && submittedJoke.formatVersion == settings.jokes.jokesFormatVersion)
                                {
                                    // format version is correct, validate joke now
                                    let validationResult = parseJokes.validateSingle(submittedJoke);

                                    if(typeof validationResult === "object")
                                        return respondWithError(res, 105, 400, fileFormat, `Submitted joke format is incorrect - encountered error${validationResult.length == 1 ? ": " : "s:\n"}${validationResult.join("\n")}`);
                                    else if(validationResult === true)
                                    {
                                        // joke is valid, find file name and then write to file

                                        let sanitizedIP = ip.replace(settings.httpServer.ipSanitization.regex, settings.httpServer.ipSanitization.replaceChar).substring(0, 8);
                                        let curUnix = new Date().getTime();
                                        let fileName = `${settings.jokes.jokeSubmissionPath}submission_${sanitizedIP}_0_${curUnix}.json`;
                                        let iter = 0;

                                        let findNextNum = currentNum => {
                                            iter++;
                                            if(iter >= settings.httpServer.rateLimiting)
                                            {
                                                logRequest("ratelimited", null, analyticsObject);
                                                return respondWithError(res, 101, 429, fileFormat);
                                            }

                                            if(fs.existsSync(`${settings.jokes.jokeSubmissionPath}submission_${sanitizedIP}_${currentNum}_${curUnix}.json`))
                                                return findNextNum(currentNum + 1);
                                            else return currentNum;
                                        };

                                        if(fs.existsSync(`${settings.jokes.jokeSubmissionPath}${fileName}`))
                                            fileName = `${settings.jokes.jokeSubmissionPath}submission_${sanitizedIP}_${findNextNum()}_${curUnix}.json`;

                                        try
                                        {
                                            // file name was found, write to file now:
                                            fs.writeFile(fileName, JSON.stringify(submittedJoke, null, 4), err => {
                                                if(!err)
                                                {
                                                    // successfully wrote to file
                                                    let responseObj = {
                                                        "error": false,
                                                        "message": "Joke submission was successfully saved. It will soon be checked out by the author.",
                                                        "submission": submittedJoke,
                                                        "timestamp": new Date().getTime()
                                                    };

                                                    let submissionObject = analyticsObject;
                                                    submissionObject.submission = submittedJoke;
                                                    logRequest("submission", ip, submissionObject);

                                                    return pipeString(res, convertFileFormat.auto(fileFormat, responseObj), parseURL.getMimeTypeFromFileFormatString(fileFormat), 201);
                                                }
                                                // error while writing to file
                                                else return respondWithError(res, 100, 500, fileFormat, `Internal error while saving joke: ${err}`);
                                            });
                                        }
                                        catch(err)
                                        {
                                            return respondWithError(res, 100, 500, fileFormat, `Internal error while saving joke: ${err}`);
                                        }
                                    }
                                }
                                else
                                {
                                    return respondWithError(res, 105, 400, fileFormat, `Joke format version is incorrect - expected "${parseJokes.jokeFormatVersion}" - got "${submittedJoke.formatVersion}"`);
                                }
                            }
                            catch(err)
                            {
                                return respondWithError(res, 105, 400, fileFormat, `Request body contains invalid JSON: ${err}`);
                            }
                        });

                        setTimeout(() => {
                            if(!dataGotten)
                            {
                                debug("HTTP", "PUT request timed out");
                                return respondWithError(res, 105, 400, fileFormat, "Request body is empty");
                            }
                        }, 3000);
                    }
                    else
                    {
                        //#MARKER Restart / invalid PUT
                        let data = "";
                        let dataGotten = false;
                        req.on("data", chunk => {
                            data += chunk;

                            if(!jsl.isEmpty(data))
                                dataGotten = true;

                            if(data == process.env.RESTART_TOKEN && parsedURL.pathArray != null && parsedURL.pathArray[0] == "restart")
                            {
                                res.writeHead(200, {"Content-Type": parseURL.getMimeTypeFromFileFormatString(fileFormat)});
                                res.end(convertFileFormat.auto(fileFormat, {
                                    "error": false,
                                    "message": `Restarting ${settings.info.name}`,
                                    "timestamp": new Date().getTime()
                                }));
                                console.log(`\n\n[${logger.getTimestamp(" | ")}]  ${jsl.colors.fg.red}IP ${jsl.colors.fg.yellow}${ip}${jsl.colors.fg.red} sent a restart command\n\n\n${jsl.colors.rst}`);
                                process.exit(2); // if the process is exited with status 2, the package node-wrap will restart the process
                            }
                            // TODO: correct anchor
                            else return respondWithErrorPage(req, res, 400, fileFormat, `Request body is invalid or was sent to the wrong endpoint "${parsedURL.pathArray != null ? parsedURL.pathArray[0] : "/"}", please refer to the documentation at ${settings.info.docsURL}#submit-joke to see how to correctly structure a joke submission.`);
                        });

                        setTimeout(() => {
                            if(!dataGotten)
                            {
                                debug("HTTP", "PUT request timed out");
                                return respondWithErrorPage(req, res, 400, fileFormat, "Request body is empty");
                            }
                        }, 3000);
                    }
                }
                //#MARKER Preflight
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
                        "message": `Wrong method "${req.method}" used. Expected "GET", "OPTIONS" or "HEAD"`,
                        "timestamp": new Date().getTime()
                    }));
                }
            });

            //#MARKER other HTTP stuff
            httpServer.on("error", err => {
                logger("error", `HTTP Server Error: ${err}`, true);
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
        };

        fs.readdir(settings.endpoints.dirPath, (err1, files) => {
            jsl.unused(err1);
            files.forEach(file => {
                let fileName = file.split(".");
                fileName.pop();
                fileName = fileName.length > 1 ? fileName.join(".") : fileName[0];

                let endpointFilePath = `${settings.endpoints.dirPath}${file}`;

                if(fs.statSync(endpointFilePath).isFile())
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

        return pipeString(res, convertFileFormat.auto(fileFormat, errObj), parseURL.getMimeTypeFromFileFormatString(fileFormat), responseCode);
    }
    catch(err)
    {
        let errMsg = `Internal error while sending error message.\nOh, the irony...\n\nPlease contact me (${settings.info.author.website}) and provide this additional info:\n${err}`;
        return pipeString(res, errMsg, "text/plain", responseCode);
    }
};

/**
 * Responds with an error page (which one is based on the status code).
 * Defaults to 500
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res 
 * @param {(404|500)} [statusCode=500] HTTP status code - defaults to 500
 * @param {String} fileFormat
 * @param {String} [error] Additional error message that gets added to the "API-Error" response header
 */
const respondWithErrorPage = (req, res, statusCode, fileFormat, error) => {
    jsl.unused([req, fileFormat]);

    statusCode = parseInt(statusCode);

    if(isNaN(statusCode))
    {
        statusCode = 500;
        error += ((!jsl.isEmpty(error) ? " - Ironically, an additional " : "An ") + "error was encountered while sending this error page: \"statusCode is not a number (in: httpServer.respondWithErrorPage)\"");
    }

    if(!jsl.isEmpty(error))
    {
        res.setHeader("Set-Cookie", `errorInfo=${JSON.stringify({"API-Error-Message": error, "API-Error-StatusCode": statusCode})}`);
        res.setHeader("API-Error", error);
    }

    return pipeFile(res, settings.documentation.errorPagePath, "text/html", statusCode);
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
 * @param {String} filePath Path to the file to respond with - relative to the project root directory
 * @param {String} mimeType The MIME type to respond with
 * @param {Number} [statusCode=200] The status code to respond with - defaults to 200
 */
const pipeFile = (res, filePath, mimeType, statusCode = 200) => {
    try
    {
        statusCode = parseInt(statusCode);
        if(isNaN(statusCode))
            throw new Error("err_statuscode_isnan");
    }
    catch(err)
    {
        return respondWithErrorPage(null, res, 500, null, `Encountered internal server error while piping file: wrong type for status code.`);
    }

    if(!fs.existsSync(filePath))
    {
        return respondWithErrorPage(null, res, 404, null, `File at "${filePath}" not found.`);
    }

    try
    {
        res.writeHead(statusCode, {
            "Content-Type": `${mimeType}; UTF-8`,
            "Content-Length": fs.statSync(filePath).size
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