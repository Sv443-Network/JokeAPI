const http = require("http");
const convertFileFormat = require("../src/fileFormatConverter");
const httpServer = require("../src/httpServer");
const parseURL = require("../src/parseURL");
const parseJokes = require("../src/parseJokes");
const FilteredJoke = require("../src/classes/FilteredJoke");
const jsl = require("svjsl");

jsl.unused(http);


const meta = {
    "name": "Category",
    "desc": "Returns a joke from the specified category"
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
    jsl.unused([req, url, params]);

    // DEBUG
    let filterJoke = new FilteredJoke(parseJokes.allJokes);
    filterJoke.setAllowedCategories(["Programming"]);
    // DEBUG

    filterJoke.getJoke().then(joke => {
        let responseText = convertFileFormat.auto(format, joke);
        httpServer.pipeString(res, responseText, parseURL.getMimeTypeFromFileFormatString(format));
    }).catch(err => {
        //TODO: format all error occurrencies for XML
        let errorObj = {
            error: true,
            internalError: false,
            code: 106,
            message: "Error while filtering jokes",
            causedBy: [err]
        };

        let responseText = convertFileFormat.auto(format, errorObj);
        httpServer.pipeString(res, responseText, parseURL.getMimeTypeFromFileFormatString(format));
    });
};

module.exports = { meta, call };