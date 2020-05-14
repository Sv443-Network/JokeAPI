const http = require("http");
const convertFileFormat = require("../src/fileFormatConverter");
const httpServer = require("../src/httpServer");
const parseURL = require("../src/parseURL");
const languages = require("../src/languages");
const jsl = require("svjsl");
const settings = require("../settings");

jsl.unused(http);


const meta = {
    "name": "LangCodes",
    "desc": "Returns the language code of the specified language",
    "usage": {
        "method": "GET",
        "url": `${settings.info.docsURL}/langcode/{LANGUAGE}`,
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
    jsl.unused([req, params]);

    let statusCode = 200;

    if(url[1] == undefined)
    {
        statusCode = 400;
        return httpServer.pipeString(res, convertFileFormat.auto(format, {
            "error": true,
            "message": `You need to specify a language in the URL. Example: /langcode/english`
        }), parseURL.getMimeTypeFromFileFormatString(format), statusCode);   
    }

    let defaultValDisabled = (params && params.noDefault && params.noDefault == true);

    let responseText = "";
    let langCode = defaultValDisabled ? null : settings.languages.defaultLanguage; //lgtm [js/useless-assignment-to-local]
    let language = url[1].toString().toLowerCase();

    let ltc = languages.languageToCode(language);
    langCode = (ltc === false ? (defaultValDisabled ? null : settings.languages.defaultLanguage) : ltc);

    if(langCode == null)
    {
        // error
        statusCode = 400;
        responseText = convertFileFormat.auto(format, {
            "error": true,
            "message": `The provided language "${language}" could not be resolved.`
        });
    }
    else
    {
        responseText = convertFileFormat.auto(format, {
            "error": false,
            "code": langCode
        });
    }

    httpServer.pipeString(res, responseText, parseURL.getMimeTypeFromFileFormatString(format), statusCode);
};

module.exports = { meta, call };
