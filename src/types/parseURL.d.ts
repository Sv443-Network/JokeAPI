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
