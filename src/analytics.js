const http = require("http");
const jsl = require("svjsl");
jsl.unused(http);



/**
 * General internal error
 * @param {("HTTP")} type 
 * @param {String} error 
 */
const internalError = (type, error) => {
    jsl.unused(error);
    switch(type)
    {
        case "HTTP":

        break;
    }
}

/**
 * IP address was rate limited
 * @param {String} ip The IP address of the request sender
 */
const rateLimited = (ip) => {
    jsl.unused(ip);

}

module.exports = { internalError, rateLimited }