const { unused } = require("svcorelib");

// const tr = require("../translate");
const languages = require("../languages");
const Endpoint = require("../classes/Endpoint");

const settings = require("../../settings");


/**
 * Returns a list of joke and system languages, as well as a list of all possible language codes
 */
class Languages extends Endpoint {
    /**
     * Returns a list of joke and system languages, as well as a list of all possible language codes
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

        super("languages", meta);
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


        let jokeLangs = languages.jokeLangs().map(jl => jl.code).sort();
        let sysLangs = languages.systemLangs().sort();

        let langArray = [];
        let pl = languages.getPossibleLanguages();

        Object.keys(pl).forEach(lc => {
            langArray.push({
                "code": lc,
                "name": pl[lc]
            });
        });

        let responseObj = {};

        if(format == "xml")
        {
            responseObj = {
                "defaultLanguage": settings.languages.defaultLanguage,
                "jokeLanguages": { "code": jokeLangs },
                "systemLanguages": { "code": sysLangs },
                "possibleLanguages": { "language": langArray },
                "timestamp": new Date().getTime()
            };
        }
        else
        {
            responseObj = {
                "defaultLanguage": settings.languages.defaultLanguage,
                "jokeLanguages": jokeLangs,
                "systemLanguages": sysLangs,
                "possibleLanguages": langArray,
                "timestamp": new Date().getTime()
            };
        }

        return Endpoint.respond(res, format, lang, responseObj);
    }
}

module.exports = Languages;
