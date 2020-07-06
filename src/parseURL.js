// this module parses the passed URL, returning an object that is uniform and easy to use

const urlParse = require("url-parse");
const jsl = require("svjsl");
const fs = require("fs-extra");

const settings = require("../settings");

/**
 * @typedef {Object} ParsedUrl
 * @prop {null} error If not errored, this will be `null`, else it will contain a string with the error message
 * @prop {String} initialURL The requested URL
 * @prop {(Array<String>|null)} pathArray If empty, this will be `null`, else it will be an array of the URL path
 * @prop {(Object|null)} queryParams If empty, this will be `null`, else it will be an object of query parameters
 */

/**
 * @typedef {Object} ErroredParsedUrl
 * @prop {String} error If not errored, this will be `null`, else it will contain a string with the error message
 * @prop {String} initialURL The requested URL
 */

/**
 * Parses the passed URL, returning a fancy object
 * @param {String} url
 * @returns {(ParsedUrl|ErroredParsedUrl)}
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
        let retObj = {
            error: null,
            initialURL: url,
            pathArray: trimFirstSlash(parsed.pathname.split("/")),
            queryParams: parsed.query == "" ? null : parsed.query
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

// *** *** *** Still leaving legacy code in, in case something goes wrong and I need to quickly switch back *** *** ***

// const parseURL = url => {
//     let error = null;

//     let pathArr = [];
//     let qstrObj = {};

//     try
//     {
//         let rawPath = url.split("?")[0];
//         let rawQstr = url.split("?")[1];


//         if(rawPath.includes("/"))
//             pathArr = rawPath.split("/");
//         else pathArr = [rawQstr];

//         if(pathArr.includes("v2"))
//         {
//             pathArr.forEach((itm, i) => {
//                 if(itm == "v2")
//                     pathArr.splice(i, 1);
//             });
//         }

//         pathArr.forEach((pathSection, i) => {
//             if(jsl.isEmpty(pathSection))
//                 pathArr.splice(i, 1);
//         });

//         // if a URL path offset was set in the settings, remove the first n elements from the path array
//         if(settings.httpServer.urlPathOffset > 0)
//         {
//             for(let i = 0; i < settings.httpServer.urlPathOffset; i++)
//             {
//                 if(pathArr.length > 0)
//                     pathArr.shift();
//             }
//         }


//         let qstrArr = [];
//         if(!jsl.isEmpty(rawQstr) && rawQstr.includes("&"))
//             qstrArr = rawQstr.split("&");
//         else if(!jsl.isEmpty(rawQstr))
//             qstrArr = [rawQstr];


//         if(qstrArr.length > 0)
//             qstrArr.forEach(qstrEntry => {
//                 if(qstrEntry.includes("="))
//                 {
//                     let splitEntry = qstrEntry.split("=");
//                     qstrObj[decodeURIComponent(splitEntry[0])] = decodeURIComponent(splitEntry[1].toLowerCase());
//                 }
//             });
//         else qstrObj = null;
//     }
//     catch(err)
//     {
//         error = err;
//     }

//     if(jsl.isArrayEmpty(pathArr))
//         pathArr = null;

//     if(!error)
//         return {
//             error: null,
//             initialURL: url,
//             pathArray: pathArr,
//             queryParams: qstrObj
//         }
//     else
//         return {
//             error: error,
//             initialURL: url
//         }
// }

const getFileFormatFromQString = qstrObj => {
    if(!jsl.isEmpty(qstrObj.format))
    {
        let possibleFormats = Object.keys(JSON.parse(fs.readFileSync(settings.jokes.fileFormatsPath).toString()));

        if(possibleFormats.includes(qstrObj.format))
            return qstrObj.format;
        else return settings.jokes.defaultFileFormat.fileFormat;
    }
    else return settings.jokes.defaultFileFormat.fileFormat;
};

/**
 * Returns the MIME type of the provided file format string (example: "json" -> "application/json")
 * @param {String} fileFormatString 
 * @returns {String}
 */
const getMimeTypeFromFileFormatString = fileFormatString => {
    let allFileTypes = JSON.parse(fs.readFileSync(settings.jokes.fileFormatsPath).toString());

    if(!jsl.isEmpty(allFileTypes[fileFormatString]))
        return allFileTypes[fileFormatString].mimeType;
    else return settings.jokes.defaultFileFormat.mimeType;
};

module.exports = parseURL;
module.exports.getFileFormatFromQString = getFileFormatFromQString;
module.exports.getMimeTypeFromFileFormatString = getMimeTypeFromFileFormatString;
