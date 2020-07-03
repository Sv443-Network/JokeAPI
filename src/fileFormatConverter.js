// this module converts JSON data into XML or YAML

const jsl = require("svjsl");
const jsonToYaml = require("json-to-pretty-yaml");
const jsonToXml = require("js2xmlparser");


/**
 * Converts a JSON object to a string representation of a XML, YAML, plain text or JSON (as fallback) object - based on a passed format string
 * @param {("xml"|"yaml"|"json"|"txt")} format Can be "xml", "yaml" or "txt", everything else will default to JSON
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
        case "txt":
            return toTXT(jsonInput);
        case "json":
        default:
            return JSON.stringify(jsonInput, null, 4);
    }
};

const toYAML = jsonInput => {
    if(jsl.isEmpty(jsonInput))
        return jsonToYaml.stringify({});
    return jsonToYaml.stringify(jsonInput);
};

const toXML = jsonInput => {
    if(jsl.isEmpty(jsonInput))
        return jsonToXml.parse("data", {});
    return jsonToXml.parse("data", jsonInput);
};

const toTXT = jsonInput => {
    let returnText = `Internal Error - no conversion mapping for data with keys "${Object.keys(jsonInput).join(", ")}" - ERR_NO_CONV_MAPPING @ FF_CONV`;

    if(!jsonInput)
        returnText = "Internal Error - could not convert data to plain text - ERR_NO_JSON_INPUT @ FF_CONV"

    if(jsonInput)
    {
        if(jsonInput.error === true)
            returnText = `${jsonInput.internalError === true ? "Internal " : ""}Error ${jsonInput.code || 100} - ${jsonInput.message}\nThis error is caused by:\n- ${jsonInput.causedBy.join("\n- ")}${jsonInput.additionalInfo ? `\n\nAdditional Information: ${jsonInput.additionalInfo}` : ""}`;
        else
        {
            if(jsonInput.joke || (jsonInput.setup && jsonInput.delivery)) // endpoint: /joke
            {
                if(jsonInput.type == "single")
                    returnText = jsonInput.joke;
                else if(jsonInput.type == "twopart")
                    returnText = `${jsonInput.setup}\n\n${jsonInput.delivery}`;
            }
            
            else if(jsonInput.formats) // endpoint: /formats
                returnText = `Available formats are: "${jsonInput.formats.join('", "')}"`;

            else if(jsonInput.categories) // endpoint: /categories
                returnText = `Available categories are: "${jsonInput.categories.join('", "')}"`;

            else if(jsonInput.flags) // endpoint: /flags
                returnText = `Available flags are: "${jsonInput.flags.join('", "')}"`;

            else if(jsonInput.ping) // endpoint: /ping
                returnText = `${jsonInput.ping}\nTimestamp: ${jsonInput.timestamp}`;

            else if(jsonInput.version) // endpoint: /info
                returnText = `Version: ${jsonInput.version}\nJoke Count: ${jsonInput.jokes.totalCount}\nCategories: "${jsonInput.jokes.categories.join('", "')}"\nFlags: "${jsonInput.jokes.flags.join('", "')}"\nSubmission URL: ${jsonInput.jokes.submissionURL}\n\n${jsonInput.info}`;

            else if(Array.isArray(jsonInput) && jsonInput[0].usage && jsonInput[0].usage.method) // endpoint: /endpoints
            {
                returnText = "Endpoints:\n\n\n";
                jsonInput.forEach(ep => {
                    returnText += `${ep.name} - ${ep.description}\n    Usage: ${ep.usage.method} ${ep.usage.url}\n    Supported parameters: ${ep.usage.supportedParams.length > 0 ? `"${ep.usage.supportedParams.join('", "')}"` : "none"}\n\n\n`
                });
            }
        }
    }

    return returnText;
};

module.exports = { auto, toYAML, toXML, toTXT };
