const http = require("http");
const zlib = require("zlib");
const UNUSED = require("svjsl").unused;


/**
 * 
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse} res 
 * @param {ReadableStream} stream 
 * @param {String} format
 */
const opportunisticResponse = (req, res, stream, format) => {
    // TODO: detect if gzip supported and then use zlib to encode
    UNUSED(zlib);
    UNUSED(format);

    res.pipe(stream);
}

module.exports = opportunisticResponse;

UNUSED(http);