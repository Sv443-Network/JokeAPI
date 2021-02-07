const { unused } = require("svcorelib");
const Endpoint = require("../src/classes/Endpoint");


class Example extends Endpoint {
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
        super("example", meta);
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

        const data = {
            error: false,
            txt: "Hi was geht",
            timestamp: new Date().getTime()
        };

        return Endpoint.respond(res, format, lang, data);
    }
}

unused(Example);
