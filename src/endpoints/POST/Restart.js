const { unused, colors } = require("svcorelib");

const SubmissionEndpoint = require("../../classes/SubmissionEndpoint");
const Endpoint = require("../../classes/Endpoint");
const resolveIP = require("../../resolveIP");
const { getTimestamp } = require("../../logger");

const settings = require("../../../settings");

const col = colors.fg;


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
                supportedParams: [],
            },
            unlisted: true,
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
        unused(url);

        const lang = Endpoint.getLang(params);
        const ip = resolveIP(req);


        const respondUnauthorized = () => {
            const responseObj = {
                "error": true,
                "message": "No, I don't think I will",
                "timestamp": Date.now(),
            };

            return Endpoint.respond(res, format, lang, responseObj, 200);
        };

        try
        {
            if(data.trim() === process.env.RESTART_TOKEN.trim())
            {
                const responseObj = {
                    "error": false,
                    "message": `Restarting ${settings.info.name}`,
                    "timestamp": Date.now(),
                };

                console.log(`\n\n[${getTimestamp(" | ")}]  ${col.red}IP ${col.yellow}${ip}${col.red} sent a restart command\n\n\n${col.rst}`);

                Endpoint.respond(res, format, lang, responseObj, 200);

                setTimeout(() => process.exit(2), 1000);
            }
            else
                return respondUnauthorized();
        }
        catch(err)
        {
            return respondUnauthorized();
        }
    }
}

module.exports = Restart;
