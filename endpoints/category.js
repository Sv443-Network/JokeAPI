const http = require("http");
const jsl = require("svjsl");
const settings = require("../settings");


const meta = {
    "name": "Category",
    "desc": "Returns a joke from the specified category"
};

/**
 * Calls this endpoint
 * @param {http.ServerResponse} res The HTTP server response
 * @param {Array<String>} url URL path array gotten from the URL parser module
 * @param {Object} params URL query params gotten from the URL parser module
 * @param {String} format The file format to respond with
 */
const call = (res, url, params, format) => {

};

module.exports = { meta, call };