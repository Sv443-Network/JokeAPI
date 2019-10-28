// this module starts the HTTP server, parses the request and calls the requested endpoint

const jsl = require("svjsl");
const UNUSED = jsl.unused;
const http = require("http");
const rateLimit = require("http-ratelimit");
const fs = require("fs");

const settings = require("../settings");
const debug = require("./verboseLogging");
const convertFileFormat = require("./fileFormatConverter");
const parseURL = require("./parseURL");
const opportunisticResponse = require("./opportunisticResponse");


const init = () => {
    debug("HTTP", "Starting HTTP server...");
    return new Promise((resolve, reject) => {
        let endpoints = [];

        let initHttpServer = () => {
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

                    if(settings.httpServer.allowCORS) {
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
                    //TODO: all of this shit
                    
                    if(parsedURL.error === null)
                    {
                        let urlPath = parsedURL.pathArray;
                        let requestedEndpoint = "";
                        let lowerCaseEndpoints = [];
                        endpoints.forEach(ep => lowerCaseEndpoints.push(ep.name.toLowerCase()));

                        if(!jsl.isEmpty(urlPath))
                            urlPath.forEach(p => {
                                if(lowerCaseEndpoints.includes(p))
                                    requestedEndpoint = lowerCaseEndpoints[lowerCaseEndpoints.indexOf(p)];
                            });
                        else requestedEndpoint = settings.endpoints.docsEndpoint;

                        let foundEndpoint = false;
                        endpoints.forEach(ep => {
                            if(ep.name == requestedEndpoint)
                            {
                                foundEndpoint = true;
                                return require(`.${ep.absPath}`).call(res, parsedURL.pathArray, parsedURL.queryParams, fileFormat);
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
                    let data = "";
                    req.on("data", chunk => {
                        data += chunk;

                        if(data == process.env.RESTART_TOKEN)
                        {
                            res.writeHead(200, {"Content-Type": parseURL.getMimeTypeFromFileFormatString(fileFormat)});
                            res.end(convertFileFormat.auto(fileFormat, {
                                "success": true,
                                "timestamp": new Date().getTime()
                            }));
                            process.exit(2); // if the process is exited with status 2, the package node-wrap will restart the process
                        }
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

    let errPage = fs.createReadStream(filePath);
    jsl.unused(error); //TODO: inject error message

    res.writeHead(statusCode, {"Content-Type": "text/html"});
    opportunisticResponse(req, res, errPage, fileFormat);    
}

module.exports = { init, respondWithError, respondWithErrorPage };