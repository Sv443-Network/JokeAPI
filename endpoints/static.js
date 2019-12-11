const http = require("http");
const httpServer = require("../src/httpServer");
const jsl = require("svjsl");
const settings = require("../settings");

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

    let filePath = settings.documentation.error404path;
    let mimeType = "text/plain";
    let statusCode = 500;
    let requestedFile = !jsl.isEmpty(url[1]) ? url[1] : null;

    switch(requestedFile)
    {
        case "index.css":
            filePath = `${settings.documentation.dirPath}index_injected.css`;
            statusCode = 200;
            mimeType = "text/css";
        break;
        case "index.js":
            filePath = `${settings.documentation.dirPath}index_injected.js`;
            statusCode = 200;
            mimeType = "application/javascript";
        break;
        case "cascadia-code.ttf":
            filePath = `${settings.documentation.dirPath}${settings.documentation.codeFontFileName}`;
            statusCode = 200;
            mimeType = "application/x-font-ttf";
        break;
        case "errorPage.css":
            filePath = `${settings.documentation.dirPath}errorPage_injected.css`;
            statusCode = 200;
            mimeType = "text/css";
        break;
        case "errorPage.js":
            filePath = `${settings.documentation.dirPath}errorPage_injected.js`;
            statusCode = 200;
            mimeType = "application/javascript";
        break;
        case "changelog":
            filePath = `./changelog.txt`;
            statusCode = 200;
            mimeType = "text/plain";
        break;
        default:
            filePath = settings.documentation.error404path;
            statusCode = 404;
            mimeType = "text/html";
        break;
    }

    httpServer.pipeFile(res, filePath, mimeType, statusCode);
};

module.exports = { call, meta };