const { unused } = require("svcorelib");

const tr = require("../../translate");
const Endpoint = require("../../classes/Endpoint");

const settings = require("../../../settings");


/**
 * Returns the available joke types
 */
class Types extends Endpoint {
    /**
     * Returns the available joke types
     */
    constructor()
    {
        /** @type {Endpoint.EndpointMeta} */
        const meta = {
            docsURL: "https://jokeapi.dev/#types-endpoint",
            usage: {
                method: "GET",
                supportedParams: [
                    "format",
                    "lang"
                ]
            }
        };

        super("types", meta);
    }

    /**
     * This method is run each time a client requests this endpoint
     * @param {http.IncomingMessage} req The HTTP server request
     * @param {http.ServerResponse} res The HTTP server response
     * @param {string[]} url URL path array gotten from the URL parser module
     * @param {Object} params URL query params gotten from the URL parser module
     * @param {string} format The file format to respond with
     */
    call(req, res, url, params, format)
    {
        unused(req, url);

        const lang = Endpoint.getLang(params);

        let statusCode = 200;
        let responseObj = {};


        const descriptions = {};

        settings.jokes.possible.types.forEach(type => {
            descriptions[type] = tr.getFilterComponentDescription(lang, "types", type);
        });

        if(format != "xml")
        {
            responseObj = {
                "error": false,
                "types": settings.jokes.possible.types,
                "descriptions": descriptions,
                "timestamp": Date.now()
            };
        }
        else
        {
            responseObj = {
                "error": false,
                "types": { "type": settings.jokes.possible.types },
                "descriptions": { "description": descriptions },
                "timestamp": Date.now()
            };
        }


        return Endpoint.respond(res, format, lang, responseObj, statusCode);
    }
}

module.exports = Types;
