const debug = require("../debug");
const Endpoint = require("./Endpoint");


/** @typedef {"categories"|"flags"|"formats"|"types"} FilterComponentName */

/**
 * Base class for all filter component endpoints (/categories/, /flags/, /formats/, etc.)
 */
class FilterComponentEndpoint extends Endpoint {
    /**
     * Constructs a new object of class JokeComponentEndpoint  
     * This class is intended to be subclassed! Don't use it "raw" like this!
     * @param {FilterComponentName} filterComponentName
     * @param {string} pathName At which path this endpoint will be called
     * @param {Endpoint.EndpointMeta} meta Meta information about this endpoint
     */
    constructor(filterComponentName, pathName, meta)
    {
        super(pathName, meta);

        debug("FilterComponentEndpoint", `Instantiated filter component endpoint "${filterComponentName}" at /${pathName}/`);
    }
}

module.exports = FilterComponentEndpoint;
