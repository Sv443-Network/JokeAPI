const http = require("http");
const httpServer = require("../src/httpServer");
const jsl = require("svjsl");
const settings = require("../settings");
const fs = require("fs-extra");
const debug = require("../src/verboseLogging");

jsl.unused(http);


const meta = {
    "name": "Static",
    "desc": "Serves static content like scripts, stylesheets and images",
    "unlisted": true,
    "noLog": true,
    "skipRateLimitCheck": true,
};

/**
 * Calls this endpoint
 * @param {http.IncomingMessage} req The HTTP server request
 * @param {http.ServerResponse} res The HTTP server response
 * @param {Array<String>} url URL path array gotten from the URL parser module
 * @param {Object} params URL query params gotten from the URL parser module
 * @param {String} format The file format to respond with
 */
const call = (req, res, url, params, format) => {
    jsl.unused([req, params, format]);

    let filePath, mimeType, statusCode;
    let requestedFile = !jsl.isEmpty(url[1]) ? url[1] : null;
    let allowEncoding = true;

    switch(requestedFile)
    {
        case "index.css":
            filePath = `${settings.documentation.compiledPath}index_injected.css`;
            statusCode = 200;
            mimeType = "text/css";
        break;
        case "index.js":
            filePath = `${settings.documentation.compiledPath}index_injected.js`;
            statusCode = 200;
            mimeType = "application/javascript";
        break;
        case "cascadia-code.ttf":
            filePath = `${settings.documentation.dirPath}${settings.documentation.codeFontFileName}`;
            statusCode = 200;
            allowEncoding = false;
            mimeType = "application/x-font-ttf";
        break;
        case "errorPage.css":
            filePath = `${settings.documentation.compiledPath}errorPage_injected.css`;
            statusCode = 200;
            mimeType = "text/css";
        break;
        case "errorPage.js":
            filePath = `${settings.documentation.compiledPath}errorPage_injected.js`;
            statusCode = 200;
            mimeType = "application/javascript";
        break;
        case "rust-icon":
            filePath = `${settings.documentation.dirPath}static/external/rust.svg`;
            statusCode = 200;
            allowEncoding = false;
            mimeType = "image/svg+xml";
        break;
        case "python-icon":
            filePath = `${settings.documentation.dirPath}static/external/python.svg`;
            statusCode = 200;
            allowEncoding = false;
            mimeType = "image/svg+xml";
        break;
        default:
            requestedFile = "fallback_err_404";
            filePath = settings.documentation.error404path;
            statusCode = 404;
            allowEncoding = false;
            mimeType = "text/html";
        break;
    }

    let selectedEncoding = null;

    if(allowEncoding)
        selectedEncoding = httpServer.getAcceptedEncoding(req);

    let fileExtension = "";

    if(selectedEncoding != null)
        fileExtension = `.${httpServer.getFileExtensionFromEncoding(selectedEncoding)}`;

    filePath = `${filePath}${fileExtension}`;

    fs.exists(filePath, exists => {
        if(exists)
        {
            if(selectedEncoding == null || selectedEncoding == "identity")
                selectedEncoding = "identity"; // identity = no encoding (see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding)
            
            debug("Static", `Serving static content "${requestedFile}" with encoding "${selectedEncoding}"`);

            res.setHeader("Content-Encoding", selectedEncoding);
            res.setHeader("Cache-Control", "max-age=86400");

            return httpServer.pipeFile(res, filePath, mimeType, statusCode);
        }
        else
        {
            debug("Static", `Serving static content "${requestedFile}" without encoding`);
            return httpServer.pipeFile(res, filePath, mimeType, statusCode);
        }
    });
};

module.exports = { call, meta };
