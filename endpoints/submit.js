const http = require("http");
const httpServer = require("../src/httpServer");
const jsl = require("svjsl");
const settings = require("../settings");

jsl.unused(http);


const meta = {
    "name": "Submit (UI)",
    "desc": "An HTML form that allows you to submit a joke",
    "usage": {
        "method": "GET",
        "url": `${settings.info.docsURL}/submit`,
        "supportedParams": []
    }
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
    jsl.unused([req, url, params, format]);

    let basePath = settings.documentation.submissionForm.dirPath;
    let fileNames = settings.documentation.submissionForm.fileNames;

    return httpServer.pipeFile(res, `${basePath}${fileNames.html}`, "text/html", 200);
};

module.exports = { meta, call };