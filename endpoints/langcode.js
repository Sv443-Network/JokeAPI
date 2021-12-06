const http = require("http");
const convertFileFormat = require("../src/fileFormatConverter");
const httpServer = require("../src/httpServer");
const parseURL = require("../src/parseURL");
const languages = require("../src/languages");
const jsl = require("svjsl");
const settings = require("../settings");
const translate = require("../src/translate");

jsl.unused(http);


const meta = {
    "name": "LangCodes",
    "desc": "Returns the language code of the specified language",
    "usage": {
        "method": "GET",
        "url": `${settings.info.docsURL}/langcode/{LANGUAGE}`,
        "supportedParams": [
            "format",
            "lang",
        ],
    },
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

    let lang = (params && params["lang"]) ? params["lang"] : settings.languages.defaultLanguage;

    if(url[1] == undefined)
    {
        statusCode = 400;
        return httpServer.pipeString(res, convertFileFormat.auto(format, {
            "error": true,
            "message": translate(lang, "noLangCodeSpecified"),
        }, lang), parseURL.getMimeTypeFromFileFormatString(format), statusCode);   
    }

    let defaultValDisabled = (params && params.noDefault && params.noDefault == true);

    let responseText = "";
    let langCode = null;
    // if(!defaultValDisabled)
    //     langCode = settings.languages.defaultLanguage;
    let language = url[1].toString().toLowerCase();

    let ltc = languages.languageToCode(language);
    langCode = (ltc === false ? (defaultValDisabled ? null : settings.languages.defaultLanguage) : ltc);

    if(langCode == null || ltc === false)
    {
        // error
        statusCode = 400;
        responseText = convertFileFormat.auto(format, {
            "error": true,
            "message": `The provided language "${decodeURIComponent(language)}" could not be resolved.`,
        }, lang);
    }
    else
    {
        responseText = convertFileFormat.auto(format, {
            "error": false,
            "code": langCode,
        }, lang);
    }

    httpServer.pipeString(res, responseText, parseURL.getMimeTypeFromFileFormatString(format), statusCode);
};

module.exports = { meta, call };
