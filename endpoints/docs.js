const fs = require("fs");
const http = require("http");
const jsl = require("svjsl");

const settings = require("../settings");
const parseURL = require("../src/parseURL");
const opportunisticResponse = require("../src/opportunisticResponse");


const meta = {
    "name": "Docs",
    "desc": "The documentation page"
};

/**
 * Calls this endpoint
 * @param {http.IncomingMessage} req The HTTP server request
 * @param {http.ServerResponse} res The HTTP server response
 * @param {Array<String>} url URL path array gotten from the URL parser module
 * @param {Object} params URL query params gotten from the URL parser module
 * @param {String} format The file format to respond with
 */
const call = (req, res, url, params, format) => {
    try
    {
        let docsFileStream = fs.createReadStream(`${settings.documentation.dirPath}documentation.html`);

        res.writeHead(200, {"Content-Type": parseURL.getMimeTypeFromFileFormatString(format)});
        opportunisticResponse(req, res, docsFileStream, format);
    }
    catch(err)
    {
        
    }
};

module.exports = { meta, call };