// this module converts JSON data into XML or YAML

const jsl = require("svjsl");
const jsonToYaml = require("json-to-pretty-yaml");
const jsonToXml = require("js2xmlparser");

const languages = require("./languages");
const tr = require("./translate");
const systemLangs = tr.systemLangs;

const settings = require("../settings");

/**
 * Converts a JSON object to a string representation of a XML, YAML, plain text or JSON (as fallback) object - based on a passed format string
 * @param {("xml"|"yaml"|"json"|"txt")} format Can be "xml", "yaml" or "txt", everything else will default to JSON
 * @param {Object} jsonInput
 * @param {String} [lang] Needed for converting to "txt" - TODO: implement everywhere
 * @returns {String} String representation of the converted object
 */
const auto = (format, jsonInput, lang) => {
    format = format.toLowerCase();
    switch(format)
    {
        case "yaml":
            return toYAML(jsonInput);
        case "xml":
            return toXML(jsonInput);
        case "txt":
            return toTXT(jsonInput, lang);
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

/**
 * Converts a JSON object to plain text, according to the set conversion mapping
 * @param {Object} jsonInput 
 * @param {String} lang 
 */
const toTXT = (jsonInput, lang) => {
    let returnText = tr(lang, "noConversionMapping", Object.keys(jsonInput).join(", "), "ERR_NO_CONV_MAPPING @ FFCONV");

    if(!jsonInput)
        returnText = tr(lang, "cantConvertToPlainText", "ERR_NO_JSON_INPUT @ FFCONV");

    if(jsonInput)
    {
        if(jsonInput.error === true)
        {
            if(jsonInput.internalError)
                returnText = tr(lang, "conversionInternalError", (jsonInput.code || 100), jsonInput.message, jsonInput.causedBy.join("\n- "), (jsonInput.additionalInfo ? jsonInput.additionalInfo : "X"));
            else
                returnText = tr(lang, "conversionGeneralError", (jsonInput.code || 100), jsonInput.message, jsonInput.causedBy.join("\n- "), (jsonInput.additionalInfo ? jsonInput.additionalInfo : "X"));
        }
        else
        {
            let categoryAliases = [];

            if((jsonInput.joke || (jsonInput.jokes && Array.isArray(jsonInput.jokes))) || (jsonInput.setup && jsonInput.delivery)) // endpoint: /joke
            {
                if(jsonInput.type == "single")
                    returnText = jsonInput.joke;
                else if(jsonInput.type == "twopart")
                    returnText = `${jsonInput.setup}\n\n${jsonInput.delivery}`;
                else if(jsonInput.type === undefined) // amount >= 2
                {
                    returnText = "";
                    jsonInput.jokes.forEach((joke, i) => {
                        if(i != 0)
                            returnText += "\n\n----------------------------------------------\n\n";

                        if(joke.type == "single")
                            returnText += joke.joke;
                        else if(joke.type == "twopart")
                            returnText += `${joke.setup}\n\n${joke.delivery}`;
                    });
                }
            }

            else if(jsonInput.categories) // endpoint: /categories
            {
                jsonInput.categoryAliases.forEach(alias => {
                    categoryAliases.push(`- ${alias.alias} -> ${alias.resolved}`);
                });
                returnText = tr(lang, "availableCategories", jsonInput.categories.map(c => `- ${c}`).join("\n"), categoryAliases.join("\n"));
            }

            else if(jsonInput.flags) // endpoint: /flags
                returnText = tr(lang, "availableFlags", jsonInput.flags.join('", "'));

            else if(jsonInput.ping) // endpoint: /ping
                returnText = `${jsonInput.ping}\n${tr(lang, "timestamp", jsonInput.timestamp)}`;

            else if(jsonInput.code) // endpoint: /langcode
                returnText = `${jsonInput.error ? tr(lang, "genericError", jsonInput.message) : tr(lang, "languageCode", jsonInput.code)}`;

            else if(jsonInput.defaultLanguage) // endpoint: /languages
            {
                let suppLangs = [];
                languages.jokeLangs().forEach(lang => {
                    suppLangs.push(`${lang.name} [${lang.code}]`);
                });

                let sysLangs = systemLangs().map(lc => `${languages.codeToLanguage(lc)} [${lc}]`);

                let possLangs = [];

                jsonInput.possibleLanguages.forEach(pl => {
                    possLangs.push(`${pl.name} [${pl.code}]`);
                });

                returnText = tr(lang, "languagesEndpoint", languages.codeToLanguage(jsonInput.defaultLanguage), jsonInput.defaultLanguage, languages.jokeLangs().length, suppLangs.sort().join(", "), sysLangs.length, sysLangs.sort().join(", "), possLangs.sort().join("\n"));
            }

            else if(jsonInput.version) // endpoint: /info
            {
                let suppLangs = [];
                languages.jokeLangs().forEach(lang => {
                    suppLangs.push(`${lang.name} [${lang.code}]`);
                });

                let sysLangs = systemLangs().map(lc => `${languages.codeToLanguage(lc)} [${lc}]`);

                let idRanges = [];
                Object.keys(jsonInput.jokes.idRange).forEach(lc => {
                    let lcIr = jsonInput.jokes.idRange[lc];
                    idRanges.push(`${languages.codeToLanguage(lc)} [${lc}]: ${lcIr[0]}-${lcIr[1]}`);
                });

                let safeJokesAmounts = [];
                jsonInput.jokes.safeJokes.forEach(safeJokesObj => {
                    safeJokesAmounts.push(`${languages.codeToLanguage(safeJokesObj.lang)} [${safeJokesObj.lang}]: ${safeJokesObj.count}`);
                });

                returnText = tr(lang, "infoEndpoint",
                                    settings.info.name, jsonInput.version, jsonInput.jokes.totalCount, jsonInput.jokes.categories.join(`", "`), jsonInput.jokes.flags.join('", "'),
                                    jsonInput.formats.join('", "'), jsonInput.jokes.types.join('", "'), jsonInput.jokes.submissionURL, idRanges.join("\n"), languages.jokeLangs().length,
                                    suppLangs.sort().join(", "), sysLangs.length, sysLangs.sort().join(", "), safeJokesAmounts.join("\n"), jsonInput.info
                                );
            }

            else if(jsonInput.formats) // endpoint: /formats
                returnText = tr(lang, "availableFormats", `"${jsonInput.formats.join('", "')}"`);

            else if(Array.isArray(jsonInput) && jsonInput[0].usage && jsonInput[0].usage.method) // endpoint: /endpoints
            {
                returnText = `${tr(lang, "endpointsWord")}:\n\n\n`;
                jsonInput.forEach(ep => {
                    returnText += `${tr(lang, "endpointDetails", ep.name, ep.description, ep.usage.method, ep.usage.url, (ep.usage.supportedParams.length > 0 ? `"${ep.usage.supportedParams.join('", "')}"` : "X"))}\n\n`;
                });
            }
        }
    }

    return returnText;
};

module.exports = { auto, toYAML, toXML, toTXT };
