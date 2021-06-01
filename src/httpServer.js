// This module starts the HTTP server, parses the request and calls the requested endpoint

const scl = require("svcorelib");
const http = require("http");
const Readable = require("stream").Readable;
const fs = require("fs-extra");
const path = require("path");
const zlib = require("zlib");
const semver = require("semver");
const portUsed = require("tcp-port-used");

const settings = require("../settings");
const debug = require("./debug");
const resolveIP = require("./resolveIP");
const logger = require("./logger");
const logRequest = require("./logRequest");
const convertFileFormat = require("./fileFormatConverter");
const parseURL = require("./parseURL");
const lists = require("./lists");
const analytics = require("./analytics");
// const jokeSubmission = require("./jokeSubmission");
const auth = require("./auth");
const meter = require("./meter");
const languages = require("./languages");
const { RateLimiterMemory, RateLimiterRes } = require("rate-limiter-flexible");
const tr = require("./translate");
const exists = require("./exists");
const Endpoint = require("./classes/Endpoint");
const SubmissionEndpoint = require("./classes/SubmissionEndpoint");

scl.unused("types:", RateLimiterRes, Endpoint, SubmissionEndpoint);


module.exports.dataEndpoints = [];
module.exports.submissionEndpoints = [];

/** @type {EpObject[]} Data endpoints */
const dataEndpoints = [];
/** @type {EpObject[]} Submission endpoints */
const submissionEndpoints = [];

/**
 * @typedef {object} HttpMetrics
 * @prop {Date} requestArrival `Date` object set to the time the request arrived at the server
 */


// TODO: implement submission endpoints like /submit and /clearData


/**
 * @typedef {Object} EpObject A cached endpoint
 * @prop {string} name File name
 * @prop {Endpoint.EndpointMeta} meta Meta object
 * @prop {string} absPath Absolute path to endpoint class
 * @prop {string} pathName Path at which to call this endpoint
 * @prop {Endpoint} instance An instance of the endpoint subclass. Use this to call the endpoint, execute base class methods, etc.
 */

function init()
{
    debug("HTTP", "Starting HTTP server...");

    return new Promise((resolve, reject) => {
        /** Whether or not the HTTP server could be initialized */
        let httpServerInitialized = false;

        /**
         * Initializes the HTTP server - should only be called once
         */
        const initHttpServer = () => {
            setTimeout(() => {
                if(!httpServerInitialized)
                    return reject(`HTTP server initialization timed out after ${settings.httpServer.startupTimeout} seconds.\nMaybe the port ${settings.httpServer.port} is already occupied or some kind of firewall or proxy blocks the connection.`);
            }, settings.httpServer.startupTimeout * 1000);

            //#SECTION create HTTP server
            const httpServer = createHttpServer();

            //#MARKER other HTTP stuff
            httpServer.on("error", err => {
                logger("error", `HTTP Server Error: ${err}`, true);
            });

            httpServer.listen(settings.httpServer.port, settings.httpServer.hostname, err => {
                if(!err)
                {
                    httpServerInitialized = true;
                    debug("HTTP", `${scl.colors.fg.green}HTTP Server successfully listens on port ${settings.httpServer.port}${scl.colors.rst}`);
                    return resolve();
                }
                else
                {
                    debug("HTTP", `${scl.colors.fg.red}HTTP listener init encountered error: ${settings.httpServer.port}${scl.colors.rst}`, "red");
                    return reject(err);
                }
            });
        };

        //#SECTION register endpoints
        const registerDataEndpoints = (folderPath) => {
            return new Promise((pRes) => {
                fs.readdir(folderPath, (err1, files) => {
                    if(err1)
                        return reject(`Error while reading the endpoints directory: ${err1}`);
        
                    files.forEach(file => {
                        let fileName = file.split(".");
                        fileName.pop();
                        fileName = fileName.length > 1 ? fileName.join(".") : fileName[0];
        
                        let endpointFilePath = path.resolve(`${folderPath}${file}`);
        
                        if(fs.statSync(endpointFilePath).isFile())
                        {
                            const EndpointClass = require(endpointFilePath);
                            /** @type {Endpoint} */
                            let instance = new EndpointClass();
        
                            dataEndpoints.push({
                                name: fileName,
                                meta: instance.getMeta(),
                                absPath: endpointFilePath,
                                pathName: instance.getPathName(),
                                instance
                            });
                        }
                    });

                    module.exports.dataEndpoints = dataEndpoints;
                    return pRes();
                });
            });
        };
        
        const registerSubmissionEndpoints = (folderPath) => {
            return new Promise((pRes) => {
                fs.readdir(folderPath, (err1, files) => {
                    if(err1)
                        return reject(`Error while reading the endpoints directory: ${err1}`);
        
                    files.forEach(file => {
                        let fileName = file.split(".");
                        fileName.pop();
                        fileName = fileName.length > 1 ? fileName.join(".") : fileName[0];
        
                        let endpointFilePath = path.resolve(`${folderPath}${file}`);
        
                        if(fs.statSync(endpointFilePath).isFile())
                        {
                            const EndpointClass = require(endpointFilePath);
                            /** @type {SubmissionEndpoint} */
                            let instance = new EndpointClass();
        
                            submissionEndpoints.push({
                                name: fileName,
                                meta: instance.getMeta(),
                                absPath: endpointFilePath,
                                pathName: instance.getPathName(),
                                instance
                            });
                        }
                    });

                    module.exports.submissionEndpoints = submissionEndpoints;
                    return pRes();
                });
            });
        };

        let promises = [
            registerDataEndpoints(settings.endpoints.get.dirPath),
            registerSubmissionEndpoints(settings.endpoints.post.dirPath)
        ];


        //#MARKER call HTTP server init
        portUsed.check(settings.httpServer.port).then(portBusy => {
            if(!portBusy)
            {
                Promise.all(promises).then(() => {
                    initHttpServer();
                }).catch(err => {
                    return reject(err);
                });
            }
            else
                return reject(`Port ${settings.httpServer.port} is already in use. Either kill the process using it or set the port in "settings.js" to a different value.`);
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
    try
    {
        let rlHeaders = {
            "Retry-After": rlRes.msBeforeNext ? Math.round(rlRes.msBeforeNext / 1000) : settings.httpServer.timeFrame,
            "RateLimit-Limit": settings.httpServer.rateLimiting,
            "RateLimit-Remaining": rlRes.msBeforeNext ? rlRes.remainingPoints : settings.httpServer.rateLimiting,
            "RateLimit-Reset": rlRes.msBeforeNext ? new Date(Date.now() + rlRes.msBeforeNext) : settings.httpServer.timeFrame
        }

        Object.keys(rlHeaders).forEach(key => {
            res.setHeader(key, rlHeaders[key]);
        });
    }
    catch(err)
    {
        let content = `Err: ${err}\nrlRes:\n${typeof rlRes == "object" ? JSON.stringify(rlRes, null, 4) : rlRes}\n\n\n`
        fs.appendFileSync("./msBeforeNext.log", content);
    }
}

/**
 * Creates the HTTP server, and makes it call `incomingRequest()` each time a request is received
 * @returns {http.Server} Returns the HTTP server
 */
function createHttpServer()
{
    return http.createServer((req, res) => {
        /** @type {HttpMetrics} */
        const httpMetrics = {
            requestArrival: new Date()
        };

        incomingRequest(req, res, httpMetrics);
        return;
    });
}

/**
 * Returns the language by parsing a `ParsedUrl` or `ErroredParsedUrl` object
 * @param {parseURL.ParsedUrl|parseURL.ErroredParsedUrl}
 */
function getLang(parsedURL)
{
    const lang = parsedURL.queryParams ? parsedURL.queryParams.lang : "invalid-lang-code";

    if(languages.isValidLang(lang))
        return lang;
    return settings.languages.defaultLanguage;
}

/**
 * This should be called each time a HTTP request is received
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {HttpMetrics} httpMetrics
 * @returns {void}
 */
function incomingRequest(req, res, httpMetrics)
{
    const parsedURL = parseURL(req.url);
    const lang = getLang(parsedURL);
    const ip = resolveIP(req);
    const headerAuth = auth.authByHeader(req, res);
    const localhostIP = resolveIP.isLocal(ip);
    let analyticsObject = {
        ipAddress: ip,
        urlPath: parsedURL.pathArray,
        urlParameters: parsedURL.queryParams
    };

    debug("HTTP", `Incoming ${req.method} request from "${ip.substring(0, 8)}${localhostIP ? `..." ${scl.colors.fg.blue}(local)${scl.colors.rst} (lang=${lang})` : "...\""} to ${req.url}`, "green");

    const fileFormat = (!scl.isEmpty(parsedURL.queryParams) && !scl.isEmpty(parsedURL.queryParams.format)) ? parseURL.getFileFormatFromQString(parsedURL.queryParams) : settings.jokes.defaultFileFormat.fileFormat;

    if(req.url.length > settings.httpServer.maxUrlLength)
        return respondWithError(res, 108, 414, fileFormat, tr(lang, "uriTooLong", req.url.length, settings.httpServer.maxUrlLength), lang, req.url.length);

    //#SECTION check lists
    try
    {
        if(lists.isBlacklisted(ip))
        {
            logRequest("blacklisted", null, analyticsObject);
            return respondWithError(res, 103, 403, fileFormat, tr(lang, "ipBlacklisted", settings.info.author.website), lang);
        }

        debug("HTTP", `Requested URL: ${parsedURL.initialURL}`);

        if(settings.httpServer.allowCORS)
        {
            try
            {
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.setHeader("Access-Control-Request-Method", "GET");
                res.setHeader("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT");
                res.setHeader("Access-Control-Allow-Headers", "*");
            }
            catch(err)
            {
                console.log(`${scl.colors.fg.red}Error while setting up CORS headers: ${err}${scl.colors.rst}`);
            }
        }

        res.setHeader("Allow", "GET, POST, HEAD, OPTIONS, PUT");

        if(settings.httpServer.infoHeaders)
            res.setHeader("API-Info", `${settings.info.name} v${settings.info.version} (${settings.info.docsURL})`);
    }
    catch(err)
    {
        let fileFormat2 = fileFormat;
        if(scl.isEmpty(fileFormat2))
        {
            fileFormat2 = settings.jokes.defaultFileFormat.fileFormat;
            if(!scl.isEmpty(parsedURL.queryParams) && !scl.isEmpty(parsedURL.queryParams.format))
            fileFormat2 = parseURL.getFileFormatFromQString(parsedURL.queryParams);
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
        return respondWithError(res, 500, 100, fileFormat2, tr(lang, "errSetupHttpResponse", err), lang);
    }

    meter.update("reqtotal", 1);
    meter.update("req1min", 1);
    meter.update("req10min", 1);

    const urlPath = parsedURL.pathArray;


    //#SECTION set up rate limiters
    let rl = new RateLimiterMemory({
        points: settings.httpServer.rateLimiting,
        duration: settings.httpServer.timeFrame
    });


    //#SECTION GET
    if(req.method === "GET")
    {
        //#MARKER GET
        if(parsedURL.error === null)
        {
            let foundEndpoint = false;

            let requestedEndpoint = "";
            // let lowerCaseEndpoints = [];
            // endpoints.forEach(ep => lowerCaseEndpoints.push(ep.name.toLowerCase()));

            if(!scl.isArrayEmpty(urlPath))
                requestedEndpoint = urlPath[0].toLowerCase();
            else
            {
                //#SECTION serve documentation
                // no URL path is present, so serve the docs
                try
                {
                    rl.get(ip).then(rlRes => {
                        if(rlRes)
                            setRateLimitedHeaders(res, rlRes);

                        foundEndpoint = true;

                        if((rlRes && rlRes._remainingPoints < 0) && !lists.isWhitelisted(ip) && !headerAuth.isAuthorized)
                        {
                            analytics.rateLimited(ip);
                            logRequest("ratelimited", `IP: ${ip}`, analyticsObject);
                            return respondWithError(res, 101, 429, fileFormat, tr(lang, "rateLimited", settings.httpServer.rateLimiting, settings.httpServer.timeFrame), lang);
                        }
                        else
                            return serveDocumentation(req, res);
                    }).catch(rlRes => {
                        if(typeof rlRes.message == "string")
                            console.error(`Error while adding point to rate limiter: ${rlRes}`);
                        else if(rlRes.remainingPoints <= 0)
                        {
                            logRequest("ratelimited", `IP: ${ip}`, analyticsObject);
                            return respondWithError(res, 101, 429, fileFormat, tr(lang, "rateLimited", settings.httpServer.rateLimiting, settings.httpServer.timeFrame), lang);
                        }
                    });
                }
                catch(err)
                {
                    // setRateLimitedHeaders(res, rlRes);
                    analytics.rateLimited(ip);
                    logRequest("ratelimited", `IP: ${ip}`, analyticsObject);
                    return respondWithError(res, 101, 429, fileFormat, tr(lang, "rateLimited", settings.httpServer.rateLimiting, settings.httpServer.timeFrame), lang);
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
            if(!scl.isEmpty(parsedURL.pathArray) && parsedURL.pathArray[0] == "favicon.ico")
                return pipeFile(res, settings.documentation.faviconPath, "image/x-icon", 200);

            dataEndpoints.forEach( /** @param {EpObject} ep Endpoint matching request URL */ async (ep) => {
                if(ep.pathName == requestedEndpoint)
                {
                    if(ep.meta.usage.method == "GET")
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
                                scl.unused(err); // gets handled elsewhere
                            }
                        }
                        
                        if(isAuthorized)
                        {
                            debug("HTTP", `Requester has valid token ${scl.colors.fg.green}${req.headers[settings.auth.tokenHeaderName] || null}${scl.colors.rst}`);
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

                        const meta = ep.meta;
                        
                        if(!scl.isEmpty(meta) && meta.skipRateLimitCheck === true)
                        {
                            try
                            {
                                if(scl.isEmpty(meta) || (!scl.isEmpty(meta) && meta.noLog !== true))
                                {
                                    if(!lists.isConsoleBlacklisted(ip))
                                        logRequest("success", null, analyticsObject);
                                }
                                // actually call the endpoint
                                return ep.instance.call(req, res, parsedURL.pathArray, parsedURL.queryParams, fileFormat, httpMetrics);
                            }
                            catch(err)
                            {
                                return respondWithError(res, 104, 500, fileFormat, tr(lang, "endpointInternalError", err), lang);
                            }
                        }
                        else
                        {
                            try
                            {
                                let rlRes = await rl.get(ip);

                                if(rlRes)
                                    setRateLimitedHeaders(res, rlRes);

                                if((rlRes && rlRes._remainingPoints < 0) && !lists.isWhitelisted(ip) && !isAuthorized)
                                {
                                    logRequest("ratelimited", `IP: ${ip}`, analyticsObject);
                                    analytics.rateLimited(ip);
                                    return respondWithError(res, 101, 429, fileFormat, tr(lang, "rateLimited", settings.httpServer.rateLimiting, settings.httpServer.timeFrame), lang);
                                }
                                else
                                {
                                    if(scl.isEmpty(meta) || (!scl.isEmpty(meta) && meta.noLog !== true))
                                    {
                                        if(!lists.isConsoleBlacklisted(ip))
                                            logRequest("success", null, analyticsObject);
                                    }
                                        
                                    return ep.instance.call(req, res, parsedURL.pathArray, parsedURL.queryParams, fileFormat, httpMetrics);
                                }
                            }
                            catch(err)
                            {
                                // setRateLimitedHeaders(res, rlRes);
                                logRequest("ratelimited", `IP: ${ip}`, analyticsObject);
                                analytics.rateLimited(ip);
                                return respondWithError(res, 100, 500, fileFormat, tr(lang, "generalInternalError", err), lang);
                            }
                        }
                    }
                }
            });

            setTimeout(() => {
                if(!foundEndpoint)
                {
                    if(!scl.isEmpty(fileFormat) && req.url.toLowerCase().includes("format"))
                        return respondWithError(res, 102, 404, fileFormat, tr(lang, "endpointNotFound", (!scl.isEmpty(requestedEndpoint) ? requestedEndpoint : "/")), lang);
                    else
                        return respondWithErrorPage(res, 404, tr(lang, "endpointNotFound", (!scl.isEmpty(requestedEndpoint) ? requestedEndpoint : "/")));
                }
            }, 5000);
        }
    }
    //#SECTION PUT / POST
    else if(req.method === "POST" || (settings.legacy.submissionEndpointsPutMethod && req.method === "PUT"))
    {
        let requestedEndpoint = "";
        if(!scl.isArrayEmpty(urlPath))
            requestedEndpoint = urlPath[0].toLowerCase();
            
        let dataInterval = setTimeout(() => {
            debug("HTTP", "PUT / POST request timed out", "red");
            return respondWithErrorPage(res, 400, tr(lang, "requestBodyIsInvalid"));
        }, settings.httpServer.submissionNoDataTimeout);


        submissionEndpoints.forEach( /** @param {EpObject} ep Endpoint matching request URL */ async (ep) => {
            if(ep.pathName == requestedEndpoint && ["POST", "PUT"].includes(ep.meta.usage.method))
            {
                // let postRateLimited = await rlPost.get(ip);

                req.on("data", chunk => {
                    const payload = chunk.toString();

                    /** Size of the payload sent by the client in bytes */
                    const payloadSize = byteLength(payload);
                    if(payloadSize > settings.httpServer.maxPayloadSize)
                        return respondWithError(res, 107, 413, fileFormat, tr(lang, "payloadTooLarge", payloadSize, settings.httpServer.maxPayloadSize), lang);

                    if(!scl.isEmpty(payload))
                        clearTimeout(dataInterval);

                    /** @type {SubmissionEndpoint} */
                    const inst = ep.instance;
                    inst.call(req, res, req.url, parsedURL.queryParams, fileFormat, payload, httpMetrics)
                });

                // //#MARKER Joke submission
                // let submissionsRateLimited = await rlSubm.get(ip);

                // if(!scl.isEmpty(parsedURL.pathArray) && parsedURL.pathArray[0] == "submit" && !(submissionsRateLimited && submissionsRateLimited._remainingPoints <= 0 && !headerAuth.isAuthorized))
                // {
                //     let data = "";
                //     req.on("data", chunk => {
                //         data += chunk;

                //         let payloadLength = byteLength(data);
                //         if(payloadLength > settings.httpServer.maxPayloadSize)
                //             return respondWithError(res, 107, 413, fileFormat, tr(lang, "payloadTooLarge", payloadLength, settings.httpServer.maxPayloadSize), lang);

                //         if(!scl.isEmpty(data))
                //             clearTimeout(dataInterval);

                //         let dryRun = (parsedURL.queryParams && parsedURL.queryParams["dry-run"] == true) || false;

                //         if(lists.isWhitelisted(ip))
                //             return jokeSubmission(res, data, fileFormat, ip, analyticsObject, dryRun);

                //         if(!dryRun)
                //         {
                //             rlSubm.consume(ip, 1).then(() => {
                //                 return jokeSubmission(res, data, fileFormat, ip, analyticsObject, dryRun);
                //             }).catch(rlRes => {
                //                 if(rlRes.remainingPoints <= 0)
                //                     return respondWithError(res, 101, 429, fileFormat, tr(lang, "rateLimited", settings.httpServer.rateLimiting, settings.httpServer.timeFrame), lang);
                //             });
                //         }
                //         else
                //         {
                //             rl.consume(ip, 1).then(rlRes => {
                //                 if(rlRes)
                //                     setRateLimitedHeaders(res, rlRes);

                //                 return jokeSubmission(res, data, fileFormat, ip, analyticsObject, dryRun);
                //             }).catch(rlRes => {
                //                 if(rlRes)
                //                     setRateLimitedHeaders(res, rlRes);

                //                 if(rlRes.remainingPoints <= 0)
                //                     return respondWithError(res, 101, 429, fileFormat, tr(lang, "rateLimited", settings.httpServer.rateLimiting, settings.httpServer.timeFrame), lang);
                //             });
                //         }
                //     });
                // }
                // else
                // {
                //     //#MARKER Restart / invalid PUT / POST

                //     if(submissionsRateLimited && submissionsRateLimited._remainingPoints <= 0 && !headerAuth.isAuthorized)
                //         return respondWithError(res, 110, 429, fileFormat, tr(lang, "rateLimitedShort"), lang);

                //     let data = "";
                //     req.on("data", chunk => {
                //         data += chunk;

                //         if(!scl.isEmpty(data))
                //             clearTimeout(dataInterval);

                //         if(data == process.env.RESTART_TOKEN && parsedURL.pathArray != null && parsedURL.pathArray[0] == "restart")
                //         {
                //             res.writeHead(200, {"Content-Type": parseURL.getMimeType(fileFormat)});
                //             res.end(convertFileFormat.auto(fileFormat, {
                //                 "error": false,
                //                 "message": `Restarting ${settings.info.name}`,
                //                 "timestamp": Date.now()
                //             }, lang));
                //             console.log(`\n\n[${logger.getTimestamp(" | ")}]  ${scl.colors.fg.red}IP ${scl.colors.fg.yellow}${ip.substr(0, 8)}[...]${scl.colors.fg.red} sent a restart command\n\n\n${scl.colors.rst}`);
                //             process.exit(2); // if the process is exited with status 2, the package node-wrap will restart the process
                //         }
                //         else return respondWithErrorPage(res, 400, tr(lang, "invalidSubmissionOrWrongEndpoint", (parsedURL.pathArray != null ? parsedURL.pathArray[0] : "/")));
                //     });
                // }
            }
        });
    }
    //#SECTION HEAD / OPTIONS
    else if(req.method === "HEAD" || req.method === "OPTIONS")
        serveDocumentation(req, res);
    //#SECTION invalid method
    else
    {
        res.writeHead(405, { "Content-Type": parseURL.getMimeType(fileFormat) });
        res.end(convertFileFormat.auto(fileFormat, {
            "error": true,
            "internalError": false,
            "message": `Wrong method "${req.method}" used. Expected "GET", "OPTIONS" or "HEAD"`,
            "timestamp": Date.now()
        }, lang));
    }
}

/**
 * Ends the request with an error. This error gets pulled from the error registry
 * @param {http.ServerResponse} res
 * @param {number} errorCode The error code
 * @param {number} responseCode The HTTP response code to end the request with
 * @param {string} fileFormat The file format to respond with - automatically gets converted to MIME type
 * @param {string} errorMessage Additional error info
 * @param {string} lang Language code of the request
 * @param {import("svcorelib").Stringifiable} args Arguments to replace numbered %-placeholders with. Only use objects that are strings or convertable to them with `.toString()`!
 * @since 2.4.0 API error code of response is now an integer instead of a string
 */
function respondWithError(res, errorCode, responseCode, fileFormat, errorMessage, lang, ...args)
{
    try
    {
        errorCode = errorCode.toString();
        let errFromRegistry = require("../data/errorMessages")[errorCode];
        let errObj = {};

        if(errFromRegistry == undefined)
            throw new Error(`Couldn't find errorMessages module or Node is using an outdated, cached version`);

        if(!lang || languages.isValidLang(lang) !== true)
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
                "code": parseInt(errorCode),
                "message": insArgs(errFromRegistry.errorMessage[lang], args) || insArgs(errFromRegistry.errorMessage[settings.languages.defaultLanguage], args),
                "causedBy": insArgs(errFromRegistry.causedBy[lang], args) || insArgs(errFromRegistry.causedBy[settings.languages.defaultLanguage], args),
                "timestamp": Date.now()
            }
        }
        else if(fileFormat == "xml")
        {
            errObj = {
                "error": true,
                "internalError": errFromRegistry.errorInternal,
                "code": parseInt(errorCode),
                "message": insArgs(errFromRegistry.errorMessage[lang], args) || insArgs(errFromRegistry.errorMessage[settings.languages.defaultLanguage], args),
                "causedBy": {"cause": insArgs(errFromRegistry.causedBy[lang], args) || insArgs(errFromRegistry.causedBy[settings.languages.defaultLanguage], args)},
                "timestamp": Date.now()
            }
        }

        if(!scl.isEmpty(errorMessage))
            errObj.additionalInfo = errorMessage;

        let converted = convertFileFormat.auto(fileFormat, errObj, lang).toString();

        return pipeString(res, converted, parseURL.getMimeType(fileFormat), responseCode);
    }
    catch(err)
    {
        let errMsg = `Internal error while sending error message.\nOh, the irony...\n\nPlease contact me (${settings.info.author.website}) and provide this additional info:\n${err}`;
        return pipeString(res, errMsg, "text/plain", responseCode);
    }
}

/**
 * Responds with an error page (which one is based on the status code).
 * Defaults to 500
 * @param {http.ServerResponse} res 
 * @param {(404|500)} [statusCode=500] HTTP status code - defaults to 500
 * @param {string} [error] Additional error message that gets added to the "API-Error" response header
 */
function respondWithErrorPage(res, statusCode, error)
{

    statusCode = parseInt(statusCode);

    if(isNaN(statusCode))
    {
        statusCode = 500;
        error += ((!scl.isEmpty(error) ? " - Ironically, an additional " : "An ") + "error was encountered while setting up this error page: \"statusCode is not a number (in: httpServer.respondWithErrorPage)\"");
    }

    if(!scl.isEmpty(error))
    {
        const cookieStr = `errorInfo=${JSON.stringify({"API-Error-Message": encodeURIComponent(error.toString()), "API-Error-StatusCode": statusCode})}`;

        res.setHeader("Set-Cookie", cookieStr);
        res.setHeader("API-Error", error);
    }

    return pipeFile(res, settings.documentation.errorPagePath, "text/html", statusCode);
}

//#MARKER response piping
/**
 * Pipes a string into a HTTP response
 * @param {http.ServerResponse} res The HTTP res object
 * @param {string} text The response body
 * @param {string} mimeType The MIME type to respond with
 * @param {number} [statusCode=200] The status code to respond with - defaults to 200
 */
function pipeString(res, text, mimeType, statusCode = 200)
{
    try
    {
        statusCode = parseInt(statusCode);
        if(isNaN(statusCode))
            throw new Error("Invalid status code");
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
                "Content-Length": byteLength(text) // Content-Length needs the byte length, not the char length
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
function pipeFile(res, filePath, mimeType, statusCode = 200)
{
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
        return respondWithErrorPage(res, 404, `Internal error: file at "${filePath}" not found.`);

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
function serveDocumentation(req, res)
{
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

    exists(filePath).then(exists => {
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
 * @returns {null|"gzip"|"deflate"|"br"} Returns null if no encodings are supported, else returns the encoding name
 */
function getAcceptedEncoding(req)
{
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
 * Returns the length of a string in bytes
 * @param {String} str
 * @returns {Number}
 */
function byteLength(str)
{
    if(!str)
        return 0;
    return Buffer.byteLength(str, "utf8");
}

/**
 * Returns the file extension for the provided encoding (without dot prefix)
 * @param {null|"gzip"|"deflate"|"br"} encoding
 * @returns {String}
 */
function getFileExtensionFromEncoding(encoding)
{
    switch(encoding)
    {
        case "gzip":
            return "gz";
        case "deflate":
            return "zz";
        case "br":
        case "brotli":
            return "br";
        default:
            return "";
    }
}

/**
 * Tries to serve data with an encoding supported by the client, else just serves the raw data
 * @param {http.IncomingMessage} req The HTTP req object
 * @param {http.ServerResponse} res The HTTP res object
 * @param {String} data The data to send to the client
 * @param {String} mimeType The MIME type to respond with
 * @param {number} statusCode HTTP response code
 */
function tryServeEncoded(req, res, data, mimeType, statusCode)
{
    let selectedEncoding = getAcceptedEncoding(req);

    debug("HTTP", `Trying to serve with encoding ${selectedEncoding}`);

    statusCode = parseInt(statusCode);
    if(isNaN(statusCode) || statusCode < 100)
        statusCode = 200;

    if(selectedEncoding)
        res.setHeader("Content-Encoding", selectedEncoding);
    else
        res.setHeader("Content-Encoding", "identity");

    switch(selectedEncoding)
    {
        case "br":
            if(!semver.lt(process.version, "v11.7.0")) // Brotli was added in Node v11.7.0
            {
                zlib.brotliCompress(data, (err, encRes) => {
                    if(!err)
                        return pipeString(res, encRes, mimeType, statusCode);
                    else
                        return pipeString(res, `Internal error while encoding text into ${selectedEncoding}: ${err}`, mimeType, statusCode);
                });
            }
            else
            {
                res.setHeader("Content-Encoding", "identity");

                return pipeString(res, data, mimeType, statusCode);
            }
        break;
        case "gzip":
            zlib.gzip(data, (err, encRes) => {
                if(!err)
                    return pipeString(res, encRes, mimeType, statusCode);
                else
                    return pipeString(res, `Internal error while encoding text into ${selectedEncoding}: ${err}`, mimeType, statusCode);
            });
        break;
        case "deflate":
            zlib.deflate(data, (err, encRes) => {
                if(!err)
                    return pipeString(res, encRes, mimeType, statusCode);
                else
                    return pipeString(res, `Internal error while encoding text into ${selectedEncoding}: ${err}`, mimeType, statusCode);
            });
        break;
        default:
            res.setHeader("Content-Encoding", "identity");

            return pipeString(res, data, mimeType, statusCode);
    }
}

module.exports = { init, respondWithError, respondWithErrorPage, pipeString, pipeFile, serveDocumentation, getAcceptedEncoding, getFileExtensionFromEncoding, tryServeEncoded };
