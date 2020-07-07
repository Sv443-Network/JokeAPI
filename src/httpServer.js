// This module starts the HTTP server, parses the request and calls the requested endpoint

const jsl = require("svjsl");
const http = require("http");
const { RateLimiterMemory, RateLimiterRes } = require("rate-limiter-flexible");
const Readable = require("stream").Readable;
const fs = require("fs-extra");

const settings = require("../settings");
const debug = require("./verboseLogging");
const resolveIP = require("./resolveIP");
const logger = require("./logger");
const logRequest = require("./logRequest");
const convertFileFormat = require("./fileFormatConverter");
const parseURL = require("./parseURL");
const lists = require("./lists");
const analytics = require("./analytics");
const jokeSubmission = require("./jokeSubmission");
const auth = require("./auth");
const meter = require("./meter");
const languages = require("./languages");

jsl.unused(RateLimiterRes); // typedef only


const init = () => {
    debug("HTTP", "Starting HTTP server...");
    return new Promise((resolve, reject) => {
        let endpoints = [];

        /**
         * Initializes the HTTP server - should only be called once
         */
        let initHttpServer = () => {
            //#SECTION set up rate limiters
            let rl = new RateLimiterMemory({
                points: settings.httpServer.rateLimiting,
                duration: settings.httpServer.timeFrame
            });

            let rlSubm = new RateLimiterMemory({
                points: settings.jokes.submissions.rateLimiting,
                duration: settings.jokes.submissions.timeFrame
            });

            //#SECTION create HTTP server
            let httpServer = http.createServer(async (req, res) => {
                let parsedURL = parseURL(req.url);
                let ip = resolveIP(req);
                let localhostIP = resolveIP.isLocal(ip);
                let headerAuth = auth.authByHeader(req, res);
                let analyticsObject = {
                    ipAddress: ip,
                    urlPath: parsedURL.pathArray,
                    urlParameters: parsedURL.queryParams
                };
                let lang = parsedURL.queryParams ? parsedURL.queryParams.lang : "invalid-lang-code";

                if(languages.isValidLang(lang) !== true)
                    lang = settings.languages.defaultLanguage;

                debug("HTTP", `Incoming ${req.method} request from "${lang}-${ip.substring(0, 8)}${localhostIP ? `..." ${jsl.colors.fg.blue}(local)${jsl.colors.rst}` : "...\""} to ${req.url}`);
                
                let fileFormat = settings.jokes.defaultFileFormat.fileFormat;
                if(!jsl.isEmpty(parsedURL.queryParams) && !jsl.isEmpty(parsedURL.queryParams.format))
                    fileFormat = parseURL.getFileFormatFromQString(parsedURL.queryParams);

                if(req.url.length > settings.httpServer.maxUrlLength)
                    return respondWithError(res, 108, 414, fileFormat, "", lang, req.url.length);

                //#SECTION check lists
                try
                {
                    if(lists.isBlacklisted(ip))
                    {
                        logRequest("blacklisted", null, analyticsObject);
                        return respondWithError(res, 103, 403, fileFormat, "", lang);
                    }

                    debug("HTTP", `Requested URL: ${parsedURL.initialURL}`);

                    if(settings.httpServer.allowCORS)
                    {
                        try
                        {
                            res.setHeader("Access-Control-Allow-Origin", "*");
                            res.setHeader("Access-Control-Request-Method", "GET");
                            res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS, PUT");
                            res.setHeader("Access-Control-Allow-Headers", "*");
                        }
                        catch(err)
                        {
                            console.log(`${jsl.colors.fg.red}Error while setting up CORS headers: ${err}${jsl.colors.rst}`);
                        }
                    }

                    res.setHeader("Allow", "GET, HEAD, OPTIONS, PUT");

                    if(settings.httpServer.infoHeaders)
                        res.setHeader("API-Info", `${settings.info.name} v${settings.info.version} (${settings.info.docsURL})`);
                }
                catch(err)
                {
                    if(jsl.isEmpty(fileFormat))
                    {
                        fileFormat = settings.jokes.defaultFileFormat.fileFormat;
                        if(!jsl.isEmpty(parsedURL.queryParams) && !jsl.isEmpty(parsedURL.queryParams.format))
                            fileFormat = parseURL.getFileFormatFromQString(parsedURL.queryParams);
                    }

                    analytics({
                        type: "Error",
                        data: {
                            errorMessage: `Error while setting up the HTTP response to "${ip.substr(8)}...": ${err}`,
                            ipAddress: ip,
                            urlParameters: parsedURL.queryParams,
                            urlPath: parsedURL.pathArray
                        }
                    });
                    return respondWithError(res, 500, 100, fileFormat, err, lang);
                }

                meter.update("reqtotal", 1);
                meter.update("req1min", 1);
                meter.update("req10min", 1);

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

                        if(!jsl.isArrayEmpty(urlPath))
                            requestedEndpoint = urlPath[0];
                        else
                        {
                            try
                            {
                                let rlRes = await rl.get(ip);

                                if((rlRes && rlRes._remainingPoints < 0) && !lists.isWhitelisted(ip) && !headerAuth.isAuthorized)
                                {
                                    setRateLimitedHeaders(res, rlRes);
                                    analytics.rateLimited(ip);
                                    logRequest("ratelimited", `IP: ${ip}`, analyticsObject);
                                    return respondWithError(res, 101, 429, fileFormat);
                                }
                                else
                                    return serveDocumentation(req, res);
                            }
                            catch(err)
                            {
                                // setRateLimitedHeaders(res, rlRes);
                                analytics.rateLimited(ip);
                                logRequest("ratelimited", `IP: ${ip}`, analyticsObject);
                                return respondWithError(res, 101, 429, fileFormat, "", lang);
                            }
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
                        endpoints.forEach(async (ep) => {
                            if(ep.name == requestedEndpoint)
                            {
                                let isAuthorized = headerAuth.isAuthorized;
                                let headerToken = headerAuth.token;

                                // now that the request is not a docs / favicon request, the blacklist is checked and the request is made eligible for rate limiting
                                if(!settings.endpoints.ratelimitBlacklist.includes(ep.name) && !isAuthorized)
                                {
                                    try
                                    {
                                        await rl.consume(ip, 1);
                                    }
                                    catch(err)
                                    {
                                        jsl.unused(err); // gets handled elsewhere
                                    }
                                }
                                
                                if(isAuthorized)
                                {
                                    debug("HTTP", `Requester has valid token ${jsl.colors.fg.green}${req.headers[settings.auth.tokenHeaderName] || null}${jsl.colors.rst}`);
                                    analytics({
                                        type: "AuthTokenIncluded",
                                        data: {
                                            ipAddress: ip,
                                            urlParameters: parsedURL.queryParams,
                                            urlPath: parsedURL.pathArray,
                                            submission: headerToken
                                        }
                                    });
                                }

                                foundEndpoint = true;

                                let callEndpoint = require(`.${ep.absPath}`);
                                let meta = callEndpoint.meta;
                                
                                if(!jsl.isEmpty(meta) && meta.skipRateLimitCheck === true)
                                {
                                    try
                                    {
                                        if(jsl.isEmpty(meta) || (!jsl.isEmpty(meta) && meta.noLog !== true))
                                        {
                                            if(!lists.isConsoleBlacklisted(ip))
                                                logRequest("success", null, analyticsObject);
                                        }
                                        return callEndpoint.call(req, res, parsedURL.pathArray, parsedURL.queryParams, fileFormat);
                                    }
                                    catch(err)
                                    {
                                        return respondWithError(res, 104, 500, fileFormat, "", lang);
                                    }
                                }
                                else
                                {
                                    try
                                    {
                                        let rlRes = await rl.get(ip);

                                        if((rlRes && rlRes._remainingPoints < 0) && !lists.isWhitelisted(ip) && !isAuthorized)
                                        {
                                            setRateLimitedHeaders(res, rlRes);
                                            logRequest("ratelimited", `IP: ${ip}`, analyticsObject);
                                            analytics.rateLimited(ip);
                                            return respondWithError(res, 101, 429, fileFormat);
                                        }
                                        else
                                        {
                                            if(jsl.isEmpty(meta) || (!jsl.isEmpty(meta) && meta.noLog !== true))
                                            {
                                                if(!lists.isConsoleBlacklisted(ip))
                                                    logRequest("success", null, analyticsObject);
                                            }
                                                
                                            return callEndpoint.call(req, res, parsedURL.pathArray, parsedURL.queryParams, fileFormat);
                                        }
                                    }
                                    catch(err)
                                    {
                                        // setRateLimitedHeaders(res, rlRes);
                                        logRequest("ratelimited", `IP: ${ip}`, analyticsObject);
                                        analytics.rateLimited(ip);
                                        return respondWithError(res, 101, 429, fileFormat);
                                    }
                                }
                            }
                        });

                        setTimeout(() => {
                            if(!foundEndpoint)
                            {
                                if(!jsl.isEmpty(fileFormat) && req.url.toLowerCase().includes("format"))
                                    return respondWithError(res, 102, 404, fileFormat, `Endpoint "${!jsl.isEmpty(requestedEndpoint) ? requestedEndpoint : "/"}" not found - Please read the documentation at ${settings.info.docsURL}#endpoints to see all available endpoints`);
                                else
                                    return respondWithErrorPage(res, 404, `Endpoint "${!jsl.isEmpty(requestedEndpoint) ? requestedEndpoint : "/"}" not found - Please read the documentation at ${settings.info.docsURL}#endpoints to see all available endpoints`);
                            }
                        }, 5000);
                    }
                }
                //#SECTION PUT
                else if(req.method === "PUT")
                {
                    //#MARKER Joke submission
                    let submissionsRateLimited = await rlSubm.get(ip);

                    if(!jsl.isEmpty(parsedURL.pathArray) && parsedURL.pathArray[0] == "submit" && !(submissionsRateLimited && submissionsRateLimited._remainingPoints < 0 && !headerAuth.isAuthorized))
                    {
                        rlSubm.consume(ip, 1);

                        let data = "";
                        let dataGotten = false;
                        req.on("data", chunk => {
                            data += chunk;

                            let payloadLength = byteLength(data);
                            if(payloadLength > settings.httpServer.maxPayloadSize)
                                return respondWithError(res, 107, 413, fileFormat, `The provided payload data is too large (${payloadLength} bytes of ${settings.httpServer.maxPayloadSize})`, lang);
                            
                            if(!jsl.isEmpty(data))
                                dataGotten = true;

                            return jokeSubmission(res, data, fileFormat, ip, analyticsObject);
                        });

                        setTimeout(() => {
                            if(!dataGotten)
                            {
                                debug("HTTP", "PUT request timed out");
                                return respondWithError(res, 105, 400, fileFormat, "Request body is empty or request timed out", lang);
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
                                console.log(`\n\n[${logger.getTimestamp(" | ")}]  ${jsl.colors.fg.red}IP ${jsl.colors.fg.yellow}${ip.substr(0, 8)}[...]${jsl.colors.fg.red} sent a restart command\n\n\n${jsl.colors.rst}`);
                                process.exit(2); // if the process is exited with status 2, the package node-wrap will restart the process
                            }
                            else return respondWithErrorPage(res, 400, `Request body is invalid or was sent to the wrong endpoint "${parsedURL.pathArray != null ? parsedURL.pathArray[0] : "/"}", please refer to the documentation at ${settings.info.docsURL}#submit-joke to see how to correctly structure a joke submission.`);
                        });

                        setTimeout(() => {
                            if(!dataGotten)
                            {
                                debug("HTTP", "PUT request timed out");
                                return respondWithErrorPage(res, 400, "Request body is empty");
                            }
                        }, 3000);
                    }
                }
                //#SECTION HEAD / OPTIONS
                else if(req.method === "HEAD" || req.method === "OPTIONS")
                    serveDocumentation(req, res);
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
            if(err1)
                return reject(`Error while reading the endpoints directory: ${err1}`);
            files.forEach(file => {
                let fileName = file.split(".");
                fileName.pop();
                fileName = fileName.length > 1 ? fileName.join(".") : fileName[0];

                let endpointFilePath = `${settings.endpoints.dirPath}${file}`;

                if(fs.statSync(endpointFilePath).isFile())
                {
                    endpoints.push({
                        name: fileName,
                        desc: require(`.${endpointFilePath}`).meta.desc, // needs an extra . cause require() is relative to this file, whereas "fs" is relative to the project root
                        absPath: endpointFilePath
                    });
                }
            });

            //#MARKER call HTTP server init
            initHttpServer();
        });
    });
}


//#MARKER error stuff
/**
 * Sets necessary headers on a `res` object so the client knows their rate limiting numbers
 * @param {http.ServerResponse} res 
 * @param {RateLimiterRes} rlRes 
 */
function setRateLimitedHeaders(res, rlRes)
{
    let rlHeaders = {
        "Retry-After": Math.round(rlRes.msBeforeNext / 1000),
        "X-RateLimit-Limit": settings.httpServer.rateLimiting,
        "X-RateLimit-Remaining": rlRes.remainingPoints,
        "X-RateLimit-Reset": new Date(Date.now() + rlRes.msBeforeNext)
    }

    Object.keys(rlHeaders).forEach(key => {
        res.setHeader(key, rlHeaders[key]);
    });
}

/**
 * Ends the request with an error. This error gets pulled from the error registry
 * @param {http.ServerResponse} res 
 * @param {Number} errorCode The error code
 * @param {Number} responseCode The HTTP response code to end the request with
 * @param {String} fileFormat The file format to respond with - automatically gets converted to MIME type
 * @param {String} errorMessage Additional error info
 * @param {String} lang Language code of the request
 * @param {...any} args Arguments to replace numbered %-placeholders with. Only use objects that are strings or convertable to them with `.toString()`!
 */
const respondWithError = (res, errorCode, responseCode, fileFormat, errorMessage, lang, ...args) => {
    try
    {
        let errFromRegistry = require(`.${settings.errors.errorMessagesPath}`)[errorCode.toString()];
        let errObj = {};

        if(!lang || !languages.isValidLang(lang))
            lang = settings.languages.defaultLanguage;

        let insArgs = (texts, insertions) => {
            if(!Array.isArray(insertions) || insertions.length <= 0)
                return texts;

            insertions.forEach((ins, i) => {

                if(Array.isArray(texts))
                    texts = texts.map(tx => tx.replace(`%${i + 1}`, ins));
                else if(typeof texts == "string")
                    texts = texts.replace(`%${i + 1}`, ins);
            });

            return texts;
        };

        if(fileFormat != "xml")
        {
            errObj = {
                "error": true,
                "internalError": errFromRegistry.errorInternal,
                "code": errorCode,
                "message": insArgs(errFromRegistry.errorMessage[lang], args) || insArgs(errFromRegistry.errorMessage[settings.languages.defaultLanguage], args),
                "causedBy": insArgs(errFromRegistry.causedBy[lang], args) || insArgs(errFromRegistry.causedBy[settings.languages.defaultLanguage], args),
                "timestamp": new Date().getTime()
            }
        }
        else if(fileFormat == "xml")
        {
            errObj = {
                "error": true,
                "internalError": errFromRegistry.errorInternal,
                "code": errorCode,
                "message": insArgs(errFromRegistry.errorMessage[lang], args) || insArgs(errFromRegistry.errorMessage[settings.languages.defaultLanguage], args),
                "causedBy": {"cause": insArgs(errFromRegistry.causedBy[lang], args) || insArgs(errFromRegistry.causedBy[settings.languages.defaultLanguage], args)},
                "timestamp": new Date().getTime()
            }
        }

        if(!jsl.isEmpty(errorMessage))
            errObj.additionalInfo = errorMessage;

        let converted = convertFileFormat.auto(fileFormat, errObj).toString();

        return pipeString(res, converted, parseURL.getMimeTypeFromFileFormatString(fileFormat), responseCode);
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
 * @param {http.ServerResponse} res 
 * @param {(404|500)} [statusCode=500] HTTP status code - defaults to 500
 * @param {String} [error] Additional error message that gets added to the "API-Error" response header
 */
const respondWithErrorPage = (res, statusCode, error) => {

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

//#MARKER response piping
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
        res.writeHead(500, {"Content-Type": `text/plain; charset=UTF-8`});
        res.end("INTERNAL_ERR:STATUS_CODE_NOT_INT");
        return;
    }

    let s = new Readable();
    s._read = () => {};
    s.push(text);
    s.push(null);

    if(!res.writableEnded)
    {
        s.pipe(res);

        if(!res.headersSent)
        {
            res.writeHead(statusCode, {
                "Content-Type": `${mimeType}; charset=UTF-8`,
                "Content-Length": text.length
            });
        }
    }
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
        return respondWithErrorPage(res, 500, `Encountered internal server error while piping file: wrong type for status code.`);
    }

    if(!fs.existsSync(filePath))
        return respondWithErrorPage(res, 404, `File at "${filePath}" not found.`);

    try
    {
        if(!res.headersSent)
        {
            res.writeHead(statusCode, {
                "Content-Type": `${mimeType}; charset=UTF-8`,
                "Content-Length": fs.statSync(filePath).size
            });
        }

        let readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    }
    catch(err)
    {
        logger("fatal", err, true);
    }
}

//#MARKER serve docs
/**
 * Serves the documentation page
 * @param {http.IncomingMessage} req The HTTP req object
 * @param {http.ServerResponse} res The HTTP res object
 */
const serveDocumentation = (req, res) => {
    let resolvedURL = parseURL(req.url);

    if(!lists.isConsoleBlacklisted(resolveIP(req)))
    {
        logRequest("docs", null, {
            ipAddress: resolveIP(req),
            urlParameters: resolvedURL.queryParams,
            urlPath: resolvedURL.pathArray
        });
    }

    let selectedEncoding = getAcceptedEncoding(req);
    let fileExtension = "";


    if(selectedEncoding != null)
        fileExtension = `.${getFileExtensionFromEncoding(selectedEncoding)}`;

    debug("HTTP", `Serving docs with encoding "${selectedEncoding}"`);

    let filePath = `${settings.documentation.compiledPath}documentation.html${fileExtension}`;
    let fallbackPath = `${settings.documentation.compiledPath}documentation.html`;

    fs.exists(filePath, exists => {
        if(exists)
        {
            if(selectedEncoding == null)
                selectedEncoding = "identity"; // identity = no encoding (see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding)
            
            res.setHeader("Content-Encoding", selectedEncoding);

            return pipeFile(res, filePath, "text/html", 200);
        }
        else
            return pipeFile(res, fallbackPath, "text/html", 200);
    }); 
}

//#MARKER util
/**
 * Returns the name of the client's accepted encoding with the highest priority
 * @param {http.IncomingMessage} req The HTTP req object
 * @returns {null|"gzip"|"deflate"|"brotli"} Returns null if no encodings are supported, else returns the encoding name
 */
const getAcceptedEncoding = req => {
    let selectedEncoding = null;

    let encodingPriority = [];

    settings.httpServer.encodings.brotli  && encodingPriority.push("br");
    settings.httpServer.encodings.gzip    && encodingPriority.push("gzip");
    settings.httpServer.encodings.deflate && encodingPriority.push("deflate");

    encodingPriority = encodingPriority.reverse();

    let acceptedEncodings = [];
    if(req.headers["accept-encoding"])
        acceptedEncodings = req.headers["accept-encoding"].split(/\s*[,]\s*/gm);
    acceptedEncodings = acceptedEncodings.reverse();

    encodingPriority.forEach(encPrio => {
        if(acceptedEncodings.includes(encPrio))
            selectedEncoding = encPrio;
    });

    return selectedEncoding;
}

/**
 * Returns the length of a string in bytes - [Source of code](https://gist.github.com/lovasoa/11357947)
 * @param {String} str
 * @returns {Number}
 */
const byteLength = str => {
    let s = str.length;
    for (let i = str.length - 1; i >= 0; i--)
    {
        let code = str.charCodeAt(i);

        if (code > 0x7f && code <= 0x7ff)
            s++;
        else if (code > 0x7ff && code <= 0xffff)
            s+=2;
        if (code >= 0xDC00 && code <= 0xDFFF)
            i--;
    }
    return s;
}

/**
 * Returns the file extension for the provided encoding (without dot prefix)
 * @param {null|"gzip"|"deflate"|"br"} encoding
 * @returns {String}
 */
const getFileExtensionFromEncoding = encoding => {
    switch(encoding)
    {
        case "gzip":
            return "gz";
        case "deflate":
            return "zz";
        case "br":
            return "br";
        default:
            return "";
    }
}

module.exports = { init, respondWithError, respondWithErrorPage, pipeString, pipeFile, serveDocumentation, getAcceptedEncoding, getFileExtensionFromEncoding };
