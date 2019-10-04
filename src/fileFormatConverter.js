// this module converts JSON data into XML or YAML

const jsl = require("svjsl");
const jsonToYaml = require("json-to-pretty-yaml");
const jsonToXml = require("js2xmlparser");

const settings = require("../settings");

jsl.unused(jsonToXml);
jsl.unused(jsonToYaml);
jsl.unused(settings);



const auto = (format, jsonInput) => {
    switch(format)
    {
        case "yaml":
            return toYAML(jsonInput);
        case "xml":
            return toXML(jsonInput);
        default:
            return jsonInput;
    }
}

const toYAML = jsonInput => {
    jsl.unused(jsonInput);
}

const toXML = jsonInput => {
    jsl.unused(jsonInput);
}

module.exports = { auto, toYAML, toXML }