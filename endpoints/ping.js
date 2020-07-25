const http = require("http");
const convertFileFormat = require("../src/fileFormatConverter");
const httpServer = require("../src/httpServer");
const parseURL = require("../src/parseURL");
const tr = require("../src/translate");
const jsl = require("svjsl");
const settings = require("../settings");

jsl.unused(http);


const meta = {
    "name": "Ping",
    "desc": `Can be used to check if ${settings.info.name} is online`,
    "usage": {
        "method": "GET",
        "url": `${settings.info.docsURL}/ping`,
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

    let lang = (params && params["lang"]) ? params["lang"] : settings.languages.defaultLanguage;

    let responseText = convertFileFormat.auto(format, {
        "error": false,
        "ping": tr(lang, "pingPong"),
        "timestamp": new Date().getTime()
    }, lang);

    httpServer.pipeString(res, responseText, parseURL.getMimeTypeFromFileFormatString(format));
};

module.exports = { meta, call };
