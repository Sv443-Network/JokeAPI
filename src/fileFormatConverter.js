// this module converts JSON data into XML or YAML

const jsl = require("svjsl");
const jsonToYaml = require("json-to-pretty-yaml");
const jsonToXml = require("js2xmlparser");


/**
 * Converts a JSON object to a string representation of a XML, YAML or JSON (as fallback) object - based on a passed format string
 * @param {("xml"|"yaml"|"json")} format Can be "xml" or "yaml", everything else will default to JSON
 * @param {Object} jsonInput 
 * @returns {String} String representation of the converted object
 */
const auto = (format, jsonInput) => {
    format = format.toLowerCase();
    switch(format)
    {
        case "yaml":
            return toYAML(jsonInput);
        case "xml":
            return toXML(jsonInput);
        default:
            return JSON.stringify(jsonInput);
    }
}

const toYAML = jsonInput => {
    if(jsl.isEmpty(jsonInput))
        return jsonToYaml.stringify({});
    return jsonToYaml.stringify(jsonInput);
}

const toXML = jsonInput => {
    if(jsl.isEmpty(jsonInput))
        return jsonToXml.parse("data", {});
    return jsonToXml.parse("data", jsonInput);
}

module.exports = { auto, toYAML, toXML }