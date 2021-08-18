const { unused } = require("svcorelib");
const { RateLimiterMemory } = require("rate-limiter-flexible");

const tr = require("../../translate");
const SubmissionEndpoint = require("../../classes/SubmissionEndpoint");
const Endpoint = require("../../classes/Endpoint");
const resolveIp = require("../../resolveIP");

const settings = require("../../../settings");


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
                    "lang"
                ]
            }
        };

        super("submit", meta);

        // set up rate limiting
        this.rlSubm = new RateLimiterMemory({
            points: settings.jokes.submissions.rateLimiting,
            duration: settings.jokes.submissions.timeFrame
        });
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


        const rateLimited = await this.rlSubm.get(ip);


        return Endpoint.respond(res, format, lang, responseObj, statusCode);
    }
}

module.exports = JokeSubmission;


// #MARKER legacy submission code

// let submissionsRateLimited = await rlSubm.get(ip);

// if(!isEmpty(parsedURL.pathArray) && parsedURL.pathArray[0] == "submit" && !(submissionsRateLimited && submissionsRateLimited._remainingPoints <= 0 && !headerAuth.isAuthorized))
// {
//     let data = "";
//     req.on("data", chunk => {
//         data += chunk;

//         let payloadLength = byteLength(data);
//         if(payloadLength > settings.httpServer.maxPayloadSize)
//             return respondWithError(res, 107, 413, fileFormat, tr(lang, "payloadTooLarge", payloadLength, settings.httpServer.maxPayloadSize), lang);

//         if(!isEmpty(data))
//             clearTimeout(dataInterval);

//         let dryRun = (parsedURL.queryParams && parsedURL.queryParams["dry-run"] == true) || false;

//         if(lists.isWhitelisted(ip))
//             return jokeSubmission(res, data, fileFormat, ip, analyticsObject, dryRun);

//         if(!dryRun)
//         {
//             rlSubm.consume(ip, 1).then(() => {
//                 return jokeSubmission(res, data, fileFormat, ip, analyticsObject, dryRun);
//             }).catch(rlRes => {
//                 if(rlRes.remainingPoints <= 0)
//                     return respondWithError(res, 101, 429, fileFormat, tr(lang, "rateLimited", settings.httpServer.rateLimiting, settings.httpServer.timeFrame), lang);
//             });
//         }
//         else
//         {
//             rl.consume(ip, 1).then(rlRes => {
//                 if(rlRes)
//                     setRateLimitedHeaders(res, rlRes);

//                 return jokeSubmission(res, data, fileFormat, ip, analyticsObject, dryRun);
//             }).catch(rlRes => {
//                 if(rlRes)
//                     setRateLimitedHeaders(res, rlRes);

//                 if(rlRes.remainingPoints <= 0)
//                     return respondWithError(res, 101, 429, fileFormat, tr(lang, "rateLimited", settings.httpServer.rateLimiting, settings.httpServer.timeFrame), lang);
//             });
//         }
//     });
// }
