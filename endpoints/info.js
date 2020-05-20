const http = require("http");
const convertFileFormat = require("../src/fileFormatConverter");
const httpServer = require("../src/httpServer");
const parseURL = require("../src/parseURL");
const jsl = require("svjsl");
const parseJokes = require("../src/parseJokes");
const languages = require("../src/languages");
const settings = require("../settings");

jsl.unused(http);


const meta = {
    "name": "Info",
    "desc": `Returns some information on ${settings.info.name}`,
    "usage": {
        "method": "GET",
        "url": `${settings.info.docsURL}/info`,
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

    let errFromRegistry = require("." + settings.errors.errorMessagesPath)["100"];
    let responseText = {};
    if(format != "xml")
    {
        responseText = {
            "error": true,
            "internalError": true,
            "code": 100,
            "message": errFromRegistry.errorMessage,
            "causedBy": errFromRegistry.causedBy,
            "timestamp": new Date().getTime()
        };
    }
    else if(format == "xml")
    {
        responseText = {
            "error": true,
            "internalError": true,
            "code": 100,
            "message": errFromRegistry.errorMessage,
            "causedBy": {"cause": errFromRegistry.causedBy},
            "timestamp": new Date().getTime()
        };
    }

    if(format != "xml")
    {
        responseText = convertFileFormat.auto(format, {
            "error": false,
            "version": settings.info.version,
            "jokes":
            {
                "totalCount": (!jsl.isEmpty(parseJokes.jokeCount) ? parseJokes.jokeCount : 0),
                "categories": [settings.jokes.possible.anyCategoryName, ...settings.jokes.possible.categories],
                "flags": settings.jokes.possible.flags,
                "submissionURL": settings.jokes.jokeSubmissionURL
            },
            "info": settings.info.infoMsg,
            "supportedLangs": languages.supportedLangs(),
            "timestamp": new Date().getTime()
        });
    }
    else if(format == "xml")
    {
        responseText = convertFileFormat.auto(format, {
            "error": false,
            "version": settings.info.version,
            "jokes":
            {
                "totalCount": (!jsl.isEmpty(parseJokes.jokeCount) ? parseJokes.jokeCount : 0),
                "categories": {"category": [settings.jokes.possible.anyCategoryName, ...settings.jokes.possible.categories]},
                "flags": {"flag": settings.jokes.possible.flags},
                "submissionURL": settings.jokes.jokeSubmissionURL
            },
            "info": settings.info.infoMsg,
            "supportedLangs": languages.supportedLangs(),
            "timestamp": new Date().getTime()
        });
    }

    httpServer.pipeString(res, responseText, parseURL.getMimeTypeFromFileFormatString(format));
};

module.exports = { meta, call };
