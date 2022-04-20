const { isEmpty, unused, filesystem } = require("svcorelib");

const { getAcceptedEncoding, getFileExtensionFromEncoding } = require("../../httpCommon");
const debug = require("../../debug");
const Endpoint = require("../../classes/Endpoint");

const settings = require("../../../settings");

/**
 * Used for checking if the API is online or to test connection latency
 */
class Static extends Endpoint {
    /**
     * Used for checking if the API is online or to test connection latency
     */
    constructor()
    {
        /** @type {Endpoint.EndpointMeta} */
        const meta = {
            usage: {
                method: "GET",
                supportedParams: []
            },
            unlisted: true,
            noLog: true,
            skipRateLimitCheck: true
        };

        super("static", meta);
    }

    /**
     * This method is run each time a client requests this endpoint
     * @param {http.IncomingMessage} req The HTTP server request
     * @param {http.ServerResponse} res The HTTP server response
     * @param {string[]} url URL path array gotten from the URL parser module
     * @param {Object} params URL query params gotten from the URL parser module
     * @param {string} format The file format to respond with
     */
    async call(req, res, url, params, format)
    {
        unused(req, url, format);

        /** Fallback identifier when no matching file was found */
        const fallbackID = "fallback_err_404";
        /** The identifier of the requested file */
        const fileID = !isEmpty(url[1]) ? url[1] : fallbackID;

        const lang = Endpoint.getLang(params);

        let filePath, mimeType, statusCode;
        let allowEncoding = true;
        let allowRobotIndexing = false; // allow indexing by robots like Googlebot

        switch(fileID)
        {
            case "index.css":
                filePath = `${settings.documentation.compiledPath}index_injected.css`;
                statusCode = 200;
                mimeType = "text/css";
            break;
            case "index.js":
                filePath = `${settings.documentation.compiledPath}index_injected.js`;
                statusCode = 200;
                mimeType = "application/javascript";
            break;
            case "cascadia-code.ttf":
                filePath = `${settings.documentation.dirPath}${settings.documentation.codeFontFileName}`;
                statusCode = 200;
                allowEncoding = false;
                mimeType = "application/x-font-ttf";
            break;
            case "errorPage.css":
                filePath = `${settings.documentation.compiledPath}errorPage_injected.css`;
                statusCode = 200;
                mimeType = "text/css";
            break;
            case "errorPage.js":
                filePath = `${settings.documentation.compiledPath}errorPage_injected.js`;
                statusCode = 200;
                mimeType = "application/javascript";
            break;
            case "rust-icon":
                filePath = `${settings.documentation.dirPath}static/external/rust.svg`;
                statusCode = 200;
                allowEncoding = false;
                mimeType = "image/svg+xml";
            break;
            case "python-icon":
                filePath = `${settings.documentation.dirPath}static/external/python.svg`;
                statusCode = 200;
                allowEncoding = false;
                mimeType = "image/svg+xml";
            break;
            case "nodejs-icon":
                filePath = `${settings.documentation.dirPath}static/external/nodejs.svg`;
                statusCode = 200;
                allowEncoding = false;
                mimeType = "image/svg+xml";
            break;
            case "golang-icon":
                filePath = `${settings.documentation.dirPath}static/external/golang.svg`;
                statusCode = 200;
                allowEncoding = false;
                mimeType = "image/svg+xml";
            break;
            case "java-icon":
                filePath = `${settings.documentation.dirPath}static/external/java.svg`;
                statusCode = 200;
                allowEncoding = false;
                mimeType = "image/svg+xml";
            break;
            case fallbackID:
            default:
                filePath = settings.documentation.error404path;
                statusCode = 404;
                allowEncoding = false;
                mimeType = "text/html";
            break;
        }

        const selectedEncoding = allowEncoding ? getAcceptedEncoding(req) : "identity"; // identity = no encoding (see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding)

        const fileExtension = selectedEncoding != "identity" ? `.${getFileExtensionFromEncoding(selectedEncoding)}` : "";


        filePath = `${filePath}${fileExtension}`;

        if(await filesystem.exists(filePath))
        {
            debug("Static", `Serving static content "${fileID}" with encoding "${selectedEncoding}"`);

            res.setHeader("Content-Encoding", selectedEncoding);
            res.setHeader("Cache-Control", `max-age=${settings.documentation.staticCacheAge}`);

            if(!allowRobotIndexing)
                res.setHeader("X-Robots-Tag", "noindex, noimageindex");

            return Endpoint.respondWithFile(res, mimeType, lang, filePath, statusCode);
        }
        else
        {
            debug("Static", `Serving static content "${fileID}" without encoding`);
            return Endpoint.respondWithFile(res, mimeType, lang, filePath, statusCode);
        }
    }
}

module.exports = Static;
