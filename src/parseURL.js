// this module parses the passed URL, returning an object that is uniform and easy to use

const urlParse = require("url-parse");
const jsl = require("svjsl");
const fs = require("fs-extra");

const settings = require("../settings");

/**
 * @typedef {Object} ParsedUrl
 * @prop {null|string} error If not errored, this will be `null`, else it will contain a string with the error message
 * @prop {string} initialURL The requested URL
 * @prop {string[]|null} pathArray If empty, this will be `null`, else it will be an array of the URL path
 * @prop {Object|null} queryParams If empty, this will be `null`, else it will be an object of query parameters
 */

/**
 * @typedef {Object} ErroredParsedUrl
 * @prop {string} error If not errored, this will be `null`, else it will contain a string with the error message
 * @prop {string} initialURL The requested URL
 */

/**
 * @typedef {Object} FileFormatsObj
 * @prop {Object} json
 * @prop {string} json.mimeType
 * @prop {Object} xml
 * @prop {string} xml.mimeType
 * @prop {Object} yaml
 * @prop {string} yaml.mimeType
 * @prop {Object} txt
 * @prop {string} txt.mimeType
 */



/** @type {FileFormatsObj} */
var fileFormats = {};

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
        let trimFirstSlash = u2 => {
            if(u2[0] == "")
                u2.shift();
            return u2;
        };

        let parsed = urlParse(url);

        let qstrObj = {};
        let qstrArr = [];
        let rawQstr = (parsed.query == "" ? null : parsed.query);

        if(rawQstr && rawQstr.startsWith("?"))
            rawQstr = rawQstr.substr(1);

        if(!jsl.isEmpty(rawQstr) && rawQstr.includes("&"))
            qstrArr = rawQstr.split("&");
        else if(!jsl.isEmpty(rawQstr))
            qstrArr = [rawQstr];


        if(qstrArr.length > 0)
        {
            qstrArr.forEach(qstrEntry => {
                if(qstrEntry.includes("="))
                {
                    let splitEntry = qstrEntry.split("=");
                    qstrObj[decodeURIComponent(splitEntry[0])] = decodeURIComponent(splitEntry[1].toLowerCase());
                }
                else
                {
                    let valuelessEntry = qstrEntry.trim();
                    qstrObj[decodeURIComponent(valuelessEntry)] = true;
                }
            });
        }
        else
            qstrObj = null;

        let retObj = {
            error: null,
            initialURL: url,
            pathArray: trimFirstSlash(parsed.pathname.split("/")),
            queryParams: qstrObj
        };

        return retObj;
    }
    catch(err)
    {
        return {
            error: err.toString(),
            initialURL: url
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
    if(!jsl.isEmpty(qstrObj.format))
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
function getMimeTypeFromFileFormatString(fileFormatString)
{
    let allFileTypes = JSON.parse(fs.readFileSync(settings.jokes.fileFormatsPath).toString());

    if(!jsl.isEmpty(allFileTypes[fileFormatString]))
        return allFileTypes[fileFormatString].mimeType;
    else
        return settings.jokes.defaultFileFormat.mimeType;
}

module.exports = parseURL;
module.exports.init = init;
module.exports.getFileFormatFromQString = getFileFormatFromQString;
module.exports.getMimeTypeFromFileFormatString = getMimeTypeFromFileFormatString;
