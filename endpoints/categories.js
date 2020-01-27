const http = require("http");
const convertFileFormat = require("../src/fileFormatConverter");
const httpServer = require("../src/httpServer");
const parseURL = require("../src/parseURL");
const jsl = require("svjsl");
const settings = require("../settings");

jsl.unused(http);


const meta = {
    "name": "Categories",
    "desc": "Returns a list of all available categories",
    "usage": {
        "method": "GET",
        "url": `${settings.info.docsURL}/categories`,
        "supportedParams": [
            "format"
        ]
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
    jsl.unused([req, url, params]);

    let responseText = "";
    let categories = [settings.jokes.possible.anyCategoryName, ...settings.jokes.possible.categories];

    if(format != "xml")
    {
        responseText = convertFileFormat.auto(format, {
            "error": false,
            "categories": categories,
            "timestamp": new Date().getTime()
        });
    }
    else if(format == "xml")
    {
        responseText = convertFileFormat.auto(format, {
            "error": false,
            "categories": {"category": categories},
            "timestamp": new Date().getTime()
        });
    }

    httpServer.pipeString(res, responseText, parseURL.getMimeTypeFromFileFormatString(format));
};

module.exports = { meta, call };