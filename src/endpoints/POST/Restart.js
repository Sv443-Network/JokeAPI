const { unused } = require("svcorelib");

const SubmissionEndpoint = require("../../classes/SubmissionEndpoint");
const Endpoint = require("../../classes/Endpoint");
const resolveIp = require("../../resolveIp");

// const settings = require("../../../settings");


/**
 * Clears all collected data of the client that called this endpoint
 */
class Restart extends SubmissionEndpoint {
    /**
     * Clears all collected data of the client that called this endpoint
     */
    constructor()
    {
        /** @type {Endpoint.EndpointMeta} */
        const meta = {
            usage: {
                method: "POST",
                supportedParams: []
            }
        };

        super("restart", meta);
    }

    /**
     * This method is run each time a client requests this endpoint
     * @param {http.IncomingMessage} req The HTTP server request
     * @param {http.ServerResponse} res The HTTP server response
     * @param {string[]} url URL path array gotten from the URL parser module
     * @param {Object} params URL query params gotten from the URL parser module
     * @param {string} format The file format to respond with
     * @param {string} data The raw data, as a string
     */
    async call(req, res, url, params, format, data)
    {
        unused(url, data);

        const lang = Endpoint.getLang(params);
        const ip = resolveIp(req);

        let statusCode = 200;
        let responseObj = {};


        unused(ip, "TODO:");
        

        return Endpoint.respond(res, format, lang, responseObj, statusCode);
    }
}

module.exports = Restart;
