// This module starts the HTTP server, parses the request and calls the requested endpoint

const { unused, filesystem, colors, isEmpty, isArrayEmpty, byteLength } = require("svcorelib");
const http = require("http");
const fs = require("fs-extra");
const path = require("path");
const portUsed = require("tcp-port-used");

const debug = require("./debug");
const resolveIP = require("./resolveIP");
const logger = require("./logger");
const logRequest = require("./logRequest");
const convertFileFormat = require("./fileFormatConverter");
const parseURL = require("./parseURL");
const lists = require("./lists");
const analytics = require("./analytics");
const auth = require("./auth");
const meter = require("./meter");
const languages = require("./languages");
const { RateLimiterMemory, RateLimiterRes } = require("rate-limiter-flexible");
const tr = require("./translate");
const Endpoint = require("./classes/Endpoint");
const SubmissionEndpoint = require("./classes/SubmissionEndpoint");

// HTTP common functions
const { pipeFile, respondWithError, respondWithErrorPage, getAcceptedEncoding, getFileExtensionFromEncoding } = require("./httpCommon");

const settings = require("../settings");

unused("types:", RateLimiterRes, Endpoint, SubmissionEndpoint);

/** @typedef {import("./types/docs").EncodingName} EncodingName */
/** @typedef {import("./types/http").HttpMetrics} HttpMetrics */
/** @typedef {import("./types/http").EpObject} EpObject */


//#MARKER "globals"

module.exports.dataEndpoints = [];
module.exports.submissionEndpoints = [];

/** @type {EpObject[]} Data endpoints */
const dataEndpoints = [];
/** @type {EpObject[]} Submission endpoints */
const submissionEndpoints = [];

// rate limiters
const rl = new RateLimiterMemory({
    points: settings.httpServer.rateLimiting,
    duration: settings.httpServer.timeFrame
});

const rlSubm = new RateLimiterMemory({
    points: settings.jokes.submissions.rateLimiting,
    duration: settings.jokes.submissions.timeFrame
});


//#MARKER init

/**
 * Initializes the HTTP server
 * @returns {Promise<object>}
 */
function init()
{
    /** Time that should be deducted from the initialization time (for operations that shouldn't be profiled) */
    let initTimeDeduction = 0;

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
                    debug("HTTP", `HTTP Server successfully listens on port ${colors.fg.green}${settings.httpServer.port}${colors.rst}`, "green");
                    return resolve({ initTimeDeduction });
                }
                else
                {
                    debug("HTTP", `${colors.fg.red}HTTP listener init encountered error: ${settings.httpServer.port}${colors.rst}`, "red");
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


        //#MARKER call HTTP server init

        // check if HTTP server port is busy
        debug("HTTP", `Checking if port ${settings.httpServer.port} is busy (this might take a while)...`);

        const portCheckTS = Date.now();
        portUsed.check(settings.httpServer.port).then(async portBusy => {
            initTimeDeduction += (Date.now() - portCheckTS);

            if(!portBusy)
            {
                try
                {
                    debug("HTTP", `${colors.fg.green}Port ${colors.fg.yellow}${settings.httpServer.port} ${colors.fg.green}is available${colors.rst}, continuing with endpoint registration...`);

                    const promises = [
                        registerDataEndpoints(settings.endpoints.get.dirPath),
                        registerSubmissionEndpoints(settings.endpoints.post.dirPath),
                    ];

                    debug("HTTP", "Starting registration of data and submission endpoints");

                    await Promise.all(promises);

                    debug("HTTP", "Successfully registered all data and submission endpoints", "green");

                    return initHttpServer();
                }
                catch(err)
                {
                    return reject(err);
                }
            }
            else
            {
                debug("HTTP", `Port ${settings.httpServer.port} ${colors.fg.red}is busy${colors.rst}`, "red");
                return reject(`TCP port ${settings.httpServer.port} is busy. Either kill the process using it or set the port in "settings.js" to a different value.`);
            }
        }).catch(err => {
            return reject(err);
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
 * @returns {string} Returns two-character language code. Defaults to `settings.languages.defaultLanguage` if none could be found.
 */
function getLang(parsedURL)
{
    const lang = parsedURL.queryParams ? parsedURL.queryParams.lang : null;

    if(languages.isValidLang(lang))
        return lang;
    else
        return settings.languages.defaultLanguage;
}

/**
 * This should be called each time a HTTP request is received
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {HttpMetrics} httpMetrics
 * @returns {void}
 */
async function incomingRequest(req, res, httpMetrics)
{
    const parsedURL = parseURL(req.url);

    if(typeof parsedURL.error === "string")
        return respondWithError(res, 111, 400, settings.jokes.defaultFileFormat.fileFormat, parsedURL.error, settings.languages.defaultLanguage);

    const lang = getLang(parsedURL);
    const ip = resolveIP(req);
    const headerAuth = auth.authByHeader(req, res);
    const localhostIP = resolveIP.isLocal(ip);
    let analyticsObject = {
        ipAddress: ip,
        urlPath: parsedURL.pathArray,
        urlParameters: parsedURL.queryParams
    };

    debug("HTTP", `Incoming ${req.method} request from '${ip.substring(0, 16)}${localhostIP ? `…' ${colors.fg.blue}(local)${colors.rst}` : "…'"} to /${parsedURL.pathArray.join("/")} [${lang}]`, "cyan");

    const fileFormat = (!isEmpty(parsedURL.queryParams) && !isEmpty(parsedURL.queryParams.format)) ? parseURL.getFileFormatFromQString(parsedURL.queryParams) : settings.jokes.defaultFileFormat.fileFormat;

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

        if(settings.httpServer.allowCORS)
        {
            try
            {
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.setHeader("Access-Control-Request-Method", "GET");
                res.setHeader("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS");
                res.setHeader("Access-Control-Allow-Headers", "*");
            }
            catch(err)
            {
                console.log(`${colors.fg.red}Error while setting up CORS headers: ${err}${colors.rst}`);
            }
        }

        res.setHeader("Allow", "GET, POST, HEAD, OPTIONS");

        if(settings.httpServer.infoHeaders)
            res.setHeader("API-Info", `${settings.info.name} v${settings.info.version} (${settings.info.docsURL})`);
    }
    catch(err)
    {
        let fileFormat2 = fileFormat;
        if(isEmpty(fileFormat2))
        {
            fileFormat2 = settings.jokes.defaultFileFormat.fileFormat;
            if(!isEmpty(parsedURL.queryParams) && !isEmpty(parsedURL.queryParams.format))
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

            if(!isArrayEmpty(urlPath))
                requestedEndpoint = urlPath[0].toLowerCase();
            else
            {
                // no URL path is present, so serve the docs
                //#SECTION serve documentation
                try
                {
                    try
                    {
                        const rlRes = await rl.get(ip);

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
                    }
                    catch(err)
                    {
                        if(typeof err.message === "string")
                            console.error(`Error while adding point to rate limiter: ${err}`);
                        else if(err.remainingPoints <= 0)
                        {
                            logRequest("ratelimited", `IP: ${ip}`, analyticsObject);
                            return respondWithError(res, 101, 429, fileFormat, tr(lang, "rateLimited", settings.httpServer.rateLimiting, settings.httpServer.timeFrame), lang);
                        }
                        else
                            return logger("fatal", `General error while serving documentation or setting up rate limiting for the documentation: ${err}`, true);
                    }
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
            if(!isEmpty(parsedURL.pathArray) && parsedURL.pathArray[0] == "favicon.ico")
                return pipeFile(res, settings.documentation.faviconPath, "image/x-icon", 200);

            /**
             * Attempts to find a matching endpoint
             */
            const findEndpoint = () => new Promise(async (pRes, pRej) => {
                for(/** @type {EpObject} */ const ep of dataEndpoints)
                {
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
                                    unused(err); // gets handled elsewhere
                                }
                            }

                            if(isAuthorized)
                            {
                                debug("HTTP", `Requester has valid token ${colors.fg.green}${headerAuth.token.substr(0, 16)}${colors.rst} …`);
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

                            if(!isEmpty(meta) && meta.skipRateLimitCheck === true)
                            {
                                try
                                {
                                    if(isEmpty(meta) || (!isEmpty(meta) && meta.noLog !== true))
                                    {
                                        if(!lists.isConsoleBlacklisted(ip))
                                            logRequest("success", null, analyticsObject);
                                    }
                                    // actually call the endpoint
                                    ep.instance.call(req, res, parsedURL.pathArray, parsedURL.queryParams, fileFormat, httpMetrics);
                                    return pRes();
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
                                    const rlRes = await rl.get(ip);

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
                                        if(isEmpty(meta) || (!isEmpty(meta) && meta.noLog !== true))
                                        {
                                            if(!lists.isConsoleBlacklisted(ip))
                                                logRequest("success", null, analyticsObject);
                                        }

                                        ep.instance.call(req, res, parsedURL.pathArray, parsedURL.queryParams, fileFormat, httpMetrics);
                                        return pRes();
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
                }

                if(!foundEndpoint)
                    return pRej();
            });


            try
            {
                await findEndpoint();
            }
            catch(err)
            {
                unused(err);
                foundEndpoint = false;
            }

            if(!foundEndpoint)
                return respondWithError(res, 102, 404, fileFormat, tr(lang, "endpointNotFound", (!isEmpty(requestedEndpoint) ? requestedEndpoint : "/")), lang);
        }
    }
    //#SECTION POST
    else if(req.method === "POST" || (settings.legacy.submissionEndpointsPutMethod && req.method === "PUT"))
    {
        let requestedEndpoint = "";
        if(!isArrayEmpty(urlPath))
            requestedEndpoint = urlPath[0].toLowerCase();

        // timeout
        const dataTimeout = setTimeout(() => {
            debug("HTTP", `${req.method} request timed out`, "red");
            return respondWithErrorPage(res, 400, tr(lang, "requestBodyIsInvalid"));
        }, settings.httpServer.submissionNoDataTimeout);


        for(/** @type {EpObject} */ const ep of submissionEndpoints)
        {
            if(ep.pathName == requestedEndpoint && ["POST", "PUT"].includes(ep.meta.usage.method))
            {
                // let postRateLimited = await rlPost.get(ip);
                let dataGotten = false;

                try
                {
                    let rlRes = await rlSubm.get(ip);

                    if(rlRes === null || rlRes.remainingPoints > 0 || lists.isWhitelisted(ip) || headerAuth.isAuthorized)
                    {
                        try
                        {
                            rlRes = await rlSubm.consume(ip, 1);

                            setRateLimitedHeaders(res, rlRes);
                        }
                        catch(errRlRes)
                        {
                            if(errRlRes.remainingPoints <= 0)
                                return respondWithError(res, 101, 429, fileFormat, tr(lang, "rateLimited", settings.httpServer.rateLimiting, settings.httpServer.timeFrame), lang);
                        }

                        req.on("data", data => {
                            dataGotten = true;

                            const payload = data.toString();

                            /** Size of the payload sent by the client in bytes */
                            const payloadSize = byteLength(payload);
                            if(payloadSize > settings.httpServer.maxPayloadSize)
                                return respondWithError(res, 107, 413, fileFormat, tr(lang, "payloadTooLarge", payloadSize, settings.httpServer.maxPayloadSize), lang);

                            clearTimeout(dataTimeout);

                            /** @type {SubmissionEndpoint} */
                            const inst = ep.instance;
                            inst.call(req, res, parsedURL.pathArray, parsedURL.queryParams, fileFormat, payload, httpMetrics);
                        });
                    }

                    req.on("close", () => {
                        if(!dataGotten)
                        {
                            if(ep.meta.acceptsEmptyBody === true)
                            {
                                // endpoint accepts empty body and no data was received
                                clearTimeout(dataTimeout);

                                /** @type {SubmissionEndpoint} */
                                const inst = ep.instance;
                                inst.call(req, res, parsedURL.pathArray, parsedURL.queryParams, fileFormat, null, httpMetrics);
                            }
                            else
                                return respondWithError(res, 112, 400, fileFormat, tr(lang, "endpointNoData", ep.name), lang);
                        }
                    });
                }
                catch(errRlRes)
                {
                    if(errRlRes.remainingPoints <= 0)
                        return respondWithError(res, 101, 429, fileFormat, tr(lang, "rateLimited", settings.httpServer.rateLimiting, settings.httpServer.timeFrame), lang);
                }
            }
        }
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

//#MARKER serve docs
/**
 * Serves the documentation page
 * @param {http.IncomingMessage} req The HTTP req object
 * @param {http.ServerResponse} res The HTTP res object
 */
async function serveDocumentation(req, res)
{
    const resolvedURL = parseURL(req.url);

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

    if(await filesystem.exists(filePath))
    {
        if(selectedEncoding == null)
            selectedEncoding = "identity"; // identity = no encoding (see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding)

        res.setHeader("Content-Encoding", selectedEncoding);

        return pipeFile(res, filePath, "text/html", 200);
    }
    else
        return pipeFile(res, fallbackPath, "text/html", 200);
}

module.exports = { init, serveDocumentation };
