const { isEmpty, byteLength, unused, files } = require("svcorelib");
const { Readable } = require("stream");
const fs = require("fs-extra");
const semver = require("semver");
const zlib = require("zlib");

const logger = require("./logger");
const debug = require("./debug");
const convertFileFormat = require("./fileFormatConverter");
const parseURL = require("./parseURL");
const languages = require("./languages");

const settings = require("../settings");

/** @typedef {import("svcorelib").Stringifiable} Stringifiable */
/** @typedef {import("./types/docs").EncodingName} EncodingName */


/**
 * Ends the request with an error. This error gets pulled from the error registry
 * @param {http.ServerResponse} res
 * @param {number} errorCode The error code
 * @param {number} responseCode The HTTP response code to end the request with
 * @param {string} fileFormat The file format to respond with - automatically gets converted to MIME type
 * @param {string} errorMessage Additional error info
 * @param {string} lang Language code of the request
 * @param {Stringifiable} args Arguments to replace numbered %-placeholders with. Only use objects that are strings or convertable to them with `.toString()`!
 * @since 2.4.0 API error code of response is now an integer instead of a string
 */
function respondWithError(res, errorCode, responseCode, fileFormat, errorMessage, lang, ...args)
{
    try
    {
        errorCode = errorCode.toString();
        const errFromRegistry = require("../data/errorMessages")[errorCode];
        let errObj = {};

        if(errFromRegistry == undefined)
            throw new Error("Couldn't find errorMessages module or Node is using an outdated, cached version");

        if(!lang || !languages.isValidLang(lang))
            lang = settings.languages.defaultLanguage;

        let insArgs = (texts, insertions) => {
            if(!Array.isArray(insertions) || insertions.length <= 0)
                return texts;

            insertions.forEach((ins, i) => {

                if(Array.isArray(texts))
                    texts = texts.map(tx => tx.replace(`%${i + 1}`, ins));
                else if(typeof texts == "string")
                    texts = texts.replace(`%${i + 1}`, ins);
            });

            return texts;
        };

        const causedBy = (errFromRegistry.causedBy && Object.keys(errFromRegistry.causedBy).length > 0) ? insArgs(errFromRegistry.causedBy[lang], args) || insArgs(errFromRegistry.causedBy[settings.languages.defaultLanguage], args) : [];

        if(fileFormat != "xml")
        {
            errObj = {
                "error": true,
                "internalError": errFromRegistry.errorInternal,
                "code": parseInt(errorCode),
                "message": insArgs(errFromRegistry.errorMessage[lang], args) || insArgs(errFromRegistry.errorMessage[settings.languages.defaultLanguage], args),
                "causedBy": causedBy,
                "timestamp": Date.now(),
            };
        }
        else if(fileFormat == "xml")
        {
            errObj = {
                "error": true,
                "internalError": errFromRegistry.errorInternal,
                "code": parseInt(errorCode),
                "message": insArgs(errFromRegistry.errorMessage[lang], args) || insArgs(errFromRegistry.errorMessage[settings.languages.defaultLanguage], args),
                "causedBy": { "cause": causedBy },
                "timestamp": Date.now(),
            };
        }

        if(!isEmpty(errorMessage))
            errObj.additionalInfo = errorMessage;

        const converted = convertFileFormat.auto(fileFormat, errObj, lang).toString();

        return pipeString(res, converted, parseURL.getMimeType(fileFormat), responseCode);
    }
    catch(err)
    {
        let errMsg = `Internal error while sending error message.\nOh, the irony...\n\nPlease contact me (${settings.info.author.website}) and provide this additional info:\n${err}`;
        return pipeString(res, errMsg, "text/plain", responseCode);
    }
}

/**
 * Responds with an error page (which one is based on the status code).
 * Defaults to 500
 * @param {http.ServerResponse} res 
 * @param {404|500} [statusCode=500] HTTP status code - defaults to 500
 * @param {string} [error] Additional error message that gets added to the "API-Error" response header
 */
function respondWithErrorPage(res, statusCode, error)
{
    statusCode = parseInt(statusCode);

    if(isNaN(statusCode))
    {
        statusCode = 500;
        error += ((!isEmpty(error) ? " - Ironically, an additional " : "An ") + "error was encountered while setting up this error page: \"statusCode is not a number (in: httpServer.respondWithErrorPage)\"");
    }

    if(!isEmpty(error))
    {
        const errInfo = Buffer.from(JSON.stringify({"API-Error-Message": encodeURIComponent(error.toString()), "API-Error-StatusCode": statusCode})).toString("base64");
        // const cookieStr = `errorInfo=${errInfo}; Expires=${new Date().toUTCString()}`;
        const cookieStr = `errorInfo=${errInfo}`;

        if(!res.headersSent)
        {
            res.setHeader("Set-Cookie", cookieStr);
            res.setHeader("API-Error", error);
        }
    }

    return pipeFile(res, settings.documentation.errorPagePath, "text/html", statusCode);
}

/**
 * Pipes a string into a HTTP response
 * @param {http.ServerResponse} res The HTTP res object
 * @param {string} text The response body
 * @param {string} mimeType The MIME type to respond with
 * @param {number} [statusCode=200] The status code to respond with - defaults to 200
 */
function pipeString(res, text, mimeType, statusCode = 200)
{
    try
    {
        statusCode = parseInt(statusCode);
        if(isNaN(statusCode))
            throw new Error("Invalid status code");
    }
    catch(err)
    {
        res.writeHead(500, {"Content-Type": "text/plain; charset=UTF-8"});
        res.end("INTERNAL_ERR:STATUS_CODE_NOT_INT");
        return;
    }

    const s = new Readable();
    s._read = () => {};
    s.push(text);
    s.push(null);

    if(!res.writableEnded)
    {
        s.pipe(res);

        if(!res.headersSent)
        {
            res.writeHead(statusCode, {
                "Content-Type": `${mimeType}; charset=UTF-8`,
                "Content-Length": byteLength(text), // Content-Length needs the byte length, not the char length
            });
        }
    }
}
 
/**
 * Pipes a file into a HTTP response
 * @param {http.ServerResponse} res The HTTP res object
 * @param {string} filePath Path to the file to respond with - relative to the project root directory
 * @param {string} mimeType The MIME type to respond with
 * @param {number} [statusCode=200] The status code to respond with - defaults to 200
 */
async function pipeFile(res, filePath, mimeType, statusCode = 200)
{
    try
    {
        statusCode = parseInt(statusCode);
        if(isNaN(statusCode))
            throw new Error("err_statuscode_isnan");
    }
    catch(err)
    {
        return respondWithErrorPage(res, 500, "Encountered internal server error while piping file: wrong type for status code.");
    }

    if(!(await files.exists(filePath)))
        return respondWithErrorPage(res, 404, `Internal error: file at "${filePath}" not found.`);

    try
    {
        if(!res.headersSent)
        {
            res.writeHead(statusCode, {
                "Content-Type": `${mimeType}; charset=UTF-8`,
                "Content-Length": fs.statSync(filePath).size,
            });
        }

        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    }
    catch(err)
    {
        logger("fatal", err, true);
    }
}

/**
 * Returns the name of the client's accepted encoding with the highest priority
 * @param {http.IncomingMessage} req The HTTP req object
 * @returns {EncodingName[]|null} Returns null if no encodings are supported, else returns the encoding name
 */
function getAcceptedEncoding(req)
{
    let encodingPriority = [];
    settings.httpServer.encodings.brotli  && encodingPriority.push("br");
    settings.httpServer.encodings.gzip    && encodingPriority.push("gzip");
    settings.httpServer.encodings.deflate && encodingPriority.push("deflate");

    encodingPriority = encodingPriority.reverse();

    const acceptedEncodings = getAllClientEncodings(req);

    if(acceptedEncodings === null)
        return null;


    let selectedEncoding = null;

    encodingPriority.forEach(encPrio => {
        if(acceptedEncodings.includes(encPrio))
            selectedEncoding = encPrio;
    });

    return selectedEncoding;
}

/**
 * Grabs all encodings of a request's "accept-encoding" header and returns them as a string array
 * @param {http.IncomingMessage} req
 * @returns {string[]|null}
 */
function getAllClientEncodings(req)
{
    const acceptEnc = req.headers["accept-encoding"];

    if(acceptEnc && acceptEnc.length > 100) // just to make sure the regex below doesn't ReDoS
        return null;

    try
    {
        /** @type {string[]} */
        let acceptedEncodings = [];
        if(acceptEnc)
            acceptedEncodings = req.headers["accept-encoding"].split(/,/gm);

        return acceptedEncodings.map(e => e.trim());
    }
    catch(err)
    {
        unused(err);
        return null;
    }
}

/**
 * Returns the file extension for the provided encoding (without dot prefix)
 * @param {null|EncodingName} encoding
 * @returns {string}
 */
function getFileExtensionFromEncoding(encoding)
{
    switch(encoding)
    {
    case "gzip":
        return "gz";
    case "deflate":
        return "zz";
    case "br":
    case "brotli":
        return "br";
    default:
        return "";
    }
}

/**
 * Tries to serve data with an encoding supported by the client, else just serves the raw data
 * @param {http.IncomingMessage} req The HTTP req object
 * @param {http.ServerResponse} res The HTTP res object
 * @param {string} data The data to send to the client
 * @param {string} mimeType The MIME type to respond with
 * @param {number} statusCode HTTP response code
 */
function tryServeEncoded(req, res, data, mimeType, statusCode)
{
    let selectedEncoding = getAcceptedEncoding(req);

    debug("HTTP", `Trying to serve with encoding ${selectedEncoding}`);

    statusCode = parseInt(statusCode);
    if(isNaN(statusCode) || statusCode < 100)
        statusCode = 200;

    if(selectedEncoding)
        res.setHeader("Content-Encoding", selectedEncoding);
    else
        res.setHeader("Content-Encoding", "identity");

    switch(selectedEncoding)
    {
    case "br":
        if(!semver.lt(process.version, "v11.7.0")) // Brotli was added in Node v11.7.0
        {
            zlib.brotliCompress(data, (err, encRes) => {
                if(!err)
                    return pipeString(res, encRes, mimeType, statusCode);
                else
                    return pipeString(res, `Internal error while encoding text into ${selectedEncoding}: ${err}`, mimeType, statusCode);
            });
        }
        else
        {
            res.setHeader("Content-Encoding", "identity");

            return pipeString(res, data, mimeType, statusCode);
        }
        break;
    case "gzip":
        zlib.gzip(data, (err, encRes) => {
            if(!err)
                return pipeString(res, encRes, mimeType, statusCode);
            else
                return pipeString(res, `Internal error while encoding text into ${selectedEncoding}: ${err}`, mimeType, statusCode);
        });
        break;
    case "deflate":
        zlib.deflate(data, (err, encRes) => {
            if(!err)
                return pipeString(res, encRes, mimeType, statusCode);
            else
                return pipeString(res, `Internal error while encoding text into ${selectedEncoding}: ${err}`, mimeType, statusCode);
        });
        break;
    default:
        res.setHeader("Content-Encoding", "identity");

        return pipeString(res, data, mimeType, statusCode);
    }
}

module.exports = {
    respondWithError,
    respondWithErrorPage,
    pipeString,
    pipeFile,
    getAcceptedEncoding,
    getFileExtensionFromEncoding,
    tryServeEncoded,
};
