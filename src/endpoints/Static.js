const scl = require("svcorelib");

const httpServer = require("../httpServer");
const debug = require("../verboseLogging");
const exists = require("../exists");
const Endpoint = require("../classes/Endpoint");

const settings = require("../../settings");

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
     * @param {object} params URL query params gotten from the URL parser module
     * @param {string} format The file format to respond with
     */
    call(req, res, url, params, format)
    {
        scl.unused(req, url, format);

        const lang = Endpoint.getLang(params);

        let filePath, mimeType, statusCode;
        let requestedFile = !scl.isEmpty(url[1]) ? url[1] : null;
        let allowEncoding = true;
        let allowRobotIndexing = false; // allow indexing by robots like Googlebot

        switch(requestedFile)
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
            default:
                requestedFile = "fallback_err_404";
                filePath = settings.documentation.error404path;
                statusCode = 404;
                allowEncoding = false;
                mimeType = "text/html";
            break;
        }

        let selectedEncoding = null;

        if(allowEncoding)
            selectedEncoding = httpServer.getAcceptedEncoding(req);

        let fileExtension = "";

        if(selectedEncoding != null)
            fileExtension = `.${httpServer.getFileExtensionFromEncoding(selectedEncoding)}`;

        filePath = `${filePath}${fileExtension}`;

        // TODO: replace with scl.filesystem.exists as soon as SCL v1.13 is out (https://github.com/Sv443/SvCoreLib/pull/16)
        exists(filePath).then(exists => {
            if(exists)
            {
                if(selectedEncoding == null || selectedEncoding == "identity")
                    selectedEncoding = "identity"; // identity = no encoding (see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding)

                debug("Static", `Serving static content "${requestedFile}" with encoding "${selectedEncoding}"`);

                res.setHeader("Content-Encoding", selectedEncoding);
                res.setHeader("Cache-Control", `max-age=${settings.documentation.staticCacheAge}`);

                if(!allowRobotIndexing)
                    res.setHeader("X-Robots-Tag", "noindex, noimageindex");

                return Endpoint.respondWithFile(res, mimeType, lang, filePath, statusCode);
            }
            else
            {
                debug("Static", `Serving static content "${requestedFile}" without encoding`);
                return Endpoint.respondWithFile(res, mimeType, lang, filePath, statusCode);
            }
        });
    }
}

module.exports = Static;
