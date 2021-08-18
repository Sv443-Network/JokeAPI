const { unused } = require("svcorelib");

const tr = require("../../translate");
const Endpoint = require("../../classes/Endpoint");
const FilterComponentEndpoint = require("../../classes/FilterComponentEndpoint");

const settings = require("../../../settings");


/**
 * Returns a list of joke blacklist flags
 */
class Flags extends FilterComponentEndpoint {
    /**
     * Returns a list of joke blacklist flags
     */
    constructor()
    {
        /** @type {Endpoint.EndpointMeta} */
        const meta = {
            docsURL: "https://jokeapi.dev/#flags-endpoint",
            usage: {
                method: "GET",
                supportedParams: [
                    "format",
                    "lang"
                ]
            }
        };

        super("flags", "flags", meta);
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

        settings.jokes.possible.flags.forEach(flag => {
            descriptions[flag] = tr.getFilterComponentDescription(lang, "flags", flag);
        });

        if(format != "xml")
        {
            responseObj = {
                "error": false,
                "flags": settings.jokes.possible.flags,
                "descriptions": descriptions,
                "timestamp": Date.now()
            };
        }
        else
        {
            responseObj = {
                "error": false,
                "flags": { "flag": settings.jokes.possible.flags },
                "descriptions": { "description": descriptions },
                "timestamp": Date.now()
            };
        }
        

        return Endpoint.respond(res, format, lang, responseObj, statusCode);
    }
}

module.exports = Flags;
