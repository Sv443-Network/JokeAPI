const { unused } = require("svcorelib");

// const tr = require("../translate");
const Endpoint = require("../../classes/Endpoint");
const FilterComponentEndpoint = require("../../classes/FilterComponentEndpoint");

const settings = require("../../../settings");


/**
 * Returns a list of supported response / file formats
 */
class Formats extends FilterComponentEndpoint {
    /**
     * Returns a list of supported response / file formats
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

        super("formats", "formats", meta);
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


        let fmtDescriptions = this.getComponentDescriptions(lang);

        if(format != "xml")
        {
            responseObj = {
                "error": false,
                "formats": settings.jokes.possible.formats,
                "formatDescriptions": fmtDescriptions,
                "timestamp": new Date().getTime()
            };
        }
        else if(format == "xml")
        {
            responseObj = {
                "error": false,
                "formats": {"format": settings.jokes.possible.formats},
                "formatDescriptions": {"description": fmtDescriptions},
                "timestamp": new Date().getTime()
            };
        }

        return Endpoint.respond(res, format, lang, responseObj, statusCode);
    }
}

module.exports = Formats;
