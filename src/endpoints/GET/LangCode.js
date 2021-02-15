const { unused } = require("svcorelib");

const tr = require("../../translate");
const languages = require("./Languages");
const Endpoint = require("../../classes/Endpoint");

const settings = require("../../../settings");


/**
 * Used for resolving a language name to a two character lang code
 */
class LangCode extends Endpoint {
    /**
     * Used for resolving a language name to a two character lang code
     */
    constructor()
    {
        /** @type {Endpoint.EndpointMeta} */
        const meta = {
            usage: {
                method: "GET",
                supportedParams: [
                    "format",
                    "lang"
                ]
            }
        };

        super("langcode", meta);

        this.positionalArguments = ["LanguageName"];
    }

    /**
     * This method is run each time a client requests this endpoint
     * @param {http.IncomingMessage} req The HTTP server request
     * @param {http.ServerResponse} res The HTTP server response
     * @param {string[]} url URL path array gotten from the URL parser module
     * @param {object} params URL query params gotten from the URL parser module
     * @param {string} format The file format to respond with
     */
    call(req, res, url, params, format)
    {
        unused(req, url);

        const lang = Endpoint.getLang(params);

        let statusCode = 200;
        let responseObj = {};


        if(url[1] == undefined)
        {
            return Endpoint.respond(res, format, lang, {
                "error": true,
                "message": tr(lang, "noLangCodeSpecified")
            });   
        }

        let defaultValDisabled = (params && params.noDefault && params.noDefault == true);

        let langCode = null;
        // if(!defaultValDisabled)
        //     langCode = settings.languages.defaultLanguage;
        let language = url[1].toString().toLowerCase();

        let ltc = languages.languageToCode(language);
        langCode = (ltc === false ? (defaultValDisabled ? null : settings.languages.defaultLanguage) : ltc);

        if(langCode == null || ltc === false)
        {
            // error
            responseObj = {
                "error": true,
                "message": tr(lang, "langCodeCouldntResolve", decodeURIComponent(language))
            };
        }
        else
        {
            responseObj = {
                "error": false,
                "code": langCode
            };
        }


        return Endpoint.respond(res, format, lang, responseObj, statusCode);
    }
}

module.exports = LangCode;
