const SubmissionEndpoint = require("../../classes/SubmissionEndpoint");
const Endpoint = require("../../classes/Endpoint");
const resolveIp = require("../../resolveIP");
const jokeSubmission = require("../../jokeSubmission");


/** @typedef {import("http").IncomingMessage} IncomingMessage */
/** @typedef {import("http").ServerResponse} ServerResponse */

/**
 * Accepts a joke object to be submitted to the API
 */
class JokeSubmission extends SubmissionEndpoint
{
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
                supportedParams: [
                    "lang",
                ],
            },
        };

        super("submit", meta);
    }

    /**
     * This method is run each time a client requests this endpoint
     * @param {IncomingMessage} req The HTTP server request
     * @param {ServerResponse} res The HTTP server response
     * @param {string[]} url URL path array gotten from the URL parser module
     * @param {object} params URL query params gotten from the URL parser module
     * @param {string} format The file format to respond with
     * @param {string} data The raw data, as a string
     */
    async call(req, res, url, params, format, data)
    {
        const lang = Endpoint.getLang(params);
        const ip = resolveIp(req);

        const dryRun = (params && params["dry-run"] === true);

        /** @type {import("../../analytics").AnalyticsSubmission} */
        const analyticsObject = {
            type: "JokeSubmission",
            data: {
                ipAddress: ip,
                urlParameters: params,
                urlPath: url,
                submission: data.toString(),
            },
        };

        return jokeSubmission(res, data, format, ip, analyticsObject, dryRun, lang);
    }
}

module.exports = JokeSubmission;
