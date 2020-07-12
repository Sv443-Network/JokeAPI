const http = require("http");
const convertFileFormat = require("../src/fileFormatConverter");
const httpServer = require("../src/httpServer");
const parseURL = require("../src/parseURL");
const jsl = require("svjsl");
const languages = require("../src/languages");
const settings = require("../settings");

jsl.unused(http);


const meta = {
    "name": "Languages",
    "desc": `Returns a list of supported and partially supported languages`,
    "usage": {
        "method": "GET",
        "url": `${settings.info.docsURL}/languages`,
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

    let jokeLangs = languages.jokeLangs().map(jl => jl.code).sort();
    let sysLangs = languages.systemLangs().sort();

    let responseText = "";

    let langArray = [];
    let pl = languages.getPossibleLanguages();

    Object.keys(pl).forEach(lc => {
        langArray.push({
            "code": lc,
            "name": pl[lc]
        });
    });

    if(format == "xml")
    {
        responseText = convertFileFormat.auto(format, {
            "defaultLanguage": settings.languages.defaultLanguage,
            "jokeLanguages": jokeLangs.map(l => ({ "code": l })),
            "systemLanguages": sysLangs.map(l => ({ "code": l })),
            "possibleLanguages": { "language": langArray },
            "timestamp": new Date().getTime()
        });
    }
    else
    {
        responseText = convertFileFormat.auto(format, {
            "defaultLanguage": settings.languages.defaultLanguage,
            "jokeLanguages": jokeLangs,
            "systemLanguages": sysLangs,
            "possibleLanguages": langArray,
            "timestamp": new Date().getTime()
        });
    }

    return httpServer.pipeString(res, responseText, parseURL.getMimeTypeFromFileFormatString(format));
};

module.exports = { meta, call };
