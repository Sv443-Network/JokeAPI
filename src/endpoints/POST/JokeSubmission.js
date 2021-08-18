const { unused } = require("svcorelib");

// const tr = require("../../translate");
const SubmissionEndpoint = require("../../classes/SubmissionEndpoint");
const Endpoint = require("../../classes/Endpoint");
const resolveIp = require("../../resolveIP");

// const settings = require("../../../settings");


/**
 * Accepts a joke object to be submitted to the API
 */
class JokeSubmission extends SubmissionEndpoint {
    /**
     * Accepts a joke object to be submitted to the API
     */
    constructor()
    {
        /** @type {Endpoint.EndpointMeta} */
        const meta = {
            docsURL: "https://jokeapi.dev/#submit-endpoint",
            usage: {
                method: "POST",
                supportedParams: []
            }
        };

        super("submit", meta);
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

module.exports = JokeSubmission;
