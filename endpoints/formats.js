const http = require("http");
const jsl = require("svjsl");
const settings = require("../settings");


const meta = {
    "name": "Formats",
    "desc": "Returns all available file formats"
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

};

module.exports = { meta, call };