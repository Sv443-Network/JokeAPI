// this module parses the passed URL, returning an object that is uniform and easy to use

const urlParse = require("url-parse");
const { isEmpty } = require("svcorelib");
const fs = require("fs-extra");

const settings = require("../settings");


/** @typedef {import("./types/parseURL").ParsedUrl} ParsedUrl */
/** @typedef {import("./types/parseURL").ErroredParsedUrl} ErroredParsedUrl */
/** @typedef {import("./types/parseURL").FileFormatsObj} FileFormatsObj */


/** @type {FileFormatsObj} */
let fileFormats = {};

/**
 * Initializes the URL parser module
 * @returns {Promise} Promise rejects if the file formats file defined at `settings.jokes.fileFormatsPath` couldn't be read
 */
function init()
{
    return new Promise((pRes, pRej) => {
        fs.readFile(settings.jokes.fileFormatsPath, (err, data) => {
            if(err)
                return pRej(`Couldn't read file formats file: ${err}`);

            fileFormats = JSON.parse(data.toString());

            return pRes();
        });
    });
}

/**
 * Parses the passed URL, returning a fancy object
 * @param {string} url
 * @returns {ParsedUrl|ErroredParsedUrl}
 */
function parseURL(url)
{
    try
    {
        const trimFirstSlash = u2 => {
            if(u2[0] === "")
                u2.shift();
            return u2;
        };

        const parsed = urlParse(url);

        let qstrObj = {};
        let qstrArr = [];
        let rawQstr = (parsed.query == "" ? null : parsed.query);

        if(rawQstr && rawQstr.startsWith("?"))
            rawQstr = rawQstr.substring(1);

        if(!isEmpty(rawQstr) && rawQstr.includes("&"))
            qstrArr = rawQstr.split("&");
        else if(!isEmpty(rawQstr))
            qstrArr = [rawQstr];


        if(qstrArr.length > 0)
        {
            qstrArr.forEach(qstrEntry => {
                if(qstrEntry.includes("="))
                {
                    const splitEntry = qstrEntry.split("=");
                    qstrObj[decodeURIComponent(splitEntry[0])] = decodeURIComponent(splitEntry[1].toLowerCase());
                }
                else
                {
                    const valuelessEntry = qstrEntry.trim();
                    qstrObj[decodeURIComponent(valuelessEntry)] = true;
                }
            });
        }
        else
            qstrObj = null;

        const retObj = {
            error: null,
            initialURL: url,
            pathArray: trimFirstSlash(parsed.pathname.split("/")),
            queryParams: qstrObj,
        };

        return retObj;
    }
    catch(err)
    {
        return {
            error: err.toString(),
            initialURL: url,
        };
    }
}

/**
 * Grabs the file format out of a query string object.  
 * If none is found, defaults to the value set in `settings.jokes.defaultFileFormat.fileFormat`
 * @param {Object} [qstrObj]
 * @returns {string}
 */
function getFileFormatFromQString(qstrObj)
{
    if(!isEmpty(qstrObj.format))
    {
        let possibleFormats = Object.keys(fileFormats);

        if(possibleFormats.includes(qstrObj.format))
            return qstrObj.format;
        else
            return settings.jokes.defaultFileFormat.fileFormat;
    }
    else
        return settings.jokes.defaultFileFormat.fileFormat;
}

/**
 * Returns the MIME type of the provided file format string (example: "json" -> "application/json")
 * @param {string} fileFormatString 
 * @returns {string}
 */
function getMimeType(fileFormatString)
{
    if(!isEmpty(fileFormats[fileFormatString]))
        return fileFormats[fileFormatString].mimeType;
    else
        return settings.jokes.defaultFileFormat.mimeType;
}

module.exports = parseURL;
module.exports.init = init;
module.exports.getFileFormatFromQString = getFileFormatFromQString;
module.exports.getMimeType = getMimeType;
