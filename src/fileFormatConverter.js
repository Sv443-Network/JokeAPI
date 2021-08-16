// this module converts JSON data into the different file formats (XML, YAML or plain text)

const { isEmpty } = require("svcorelib");
const jsonToYaml = require("json-to-pretty-yaml");
const jsonToXml = require("js2xmlparser");

const languages = require("./languages");
const tr = require("./translate");
const systemLangs = tr.systemLangs;

const settings = require("../settings");


/** @typedef {import("svcorelib").JSONCompatible} JSONCompatible */

/** @typedef {"xml"|"yaml"|"json"|"txt"} FileFormat */

/**
 * Converts a JSON-compatible object to a string representation of a XML, YAML, plain text or JSON object (as fallback) - based on the passed format string
 * @param {FileFormat} format Can be `xml`, `yaml` or `txt`, everything else will default to JSON
 * @param {JSONCompatible} jsonInput
 * @param {string} [lang] Used only for converting to`"txt`
 * @returns {string} String representation of the converted object
 */
function auto(format, jsonInput, lang)
{
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
            // throw new TypeError(`Error in FileFormatConverter: format "${format}" is invalid`);
    }
}

/**
 * Converts a JSON-compatible object to a YAML representation
 * @param {JSONCompatible} jsonInput
 * @returns {string}
 */
function toYAML(jsonInput)
{
    if(isEmpty(jsonInput))
        return jsonToYaml.stringify({});
    return jsonToYaml.stringify(jsonInput);
}

/**
 * Converts a JSON-compatible object to an XML representation
 * @param {JSONCompatible} jsonInput
 * @returns {string}
 */
 function toXML(jsonInput)
{
    if(isEmpty(jsonInput))
        return jsonToXml.parse("data", {});
    return jsonToXml.parse("data", jsonInput);
}

/**
 * Converts a JSON-compatible object to plain text, according to the set conversion mapping and language
 * @param {JSONCompatible} jsonInput
 * @param {string} [lang] Language for translations (defaults to `settings.languages.defaultLanguage`)
 */
function toTXT(jsonInput, lang)
{
    if(!languages.isValidLang(lang))
        lang = settings.languages.defaultLanguage;

    let returnText = tr(lang, "noConversionMapping", Object.keys(jsonInput).join(", "), "ERR_NO_CONV_MAPPING @ FFCONV");

    if(!jsonInput || typeof jsonInput != "object")
        returnText = tr(lang, "cantConvertToPlainText", "ERR_NO_JSON_INPUT @ FFCONV");
    else
    {
        if(jsonInput.error === true)
        {
            const causes = Array.isArray(jsonInput.causedBy) ? jsonInput.causedBy.join("\n- ") : "[x]";

            if(jsonInput.internalError)
                returnText = tr(lang, "conversionInternalError", (jsonInput.code || 100), jsonInput.message, causes, (jsonInput.additionalInfo || "(x)"));
            else
                returnText = tr(lang, "conversionGeneralError", (jsonInput.code || 100), jsonInput.message, causes, (jsonInput.additionalInfo || "(x)"));
        }
        else
        {
            //#SECTION endpoint /joke
            if((jsonInput.joke || (jsonInput.jokes && Array.isArray(jsonInput.jokes))) || (jsonInput.setup && jsonInput.delivery))
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

            //#SECTION endpoint /categories
            else if(jsonInput.categories)
            {
                let categoryAliases = [];
                let categoryDescriptions = [];

                jsonInput.categoryAliases.forEach(alias => {
                    categoryAliases.push(`- ${alias.alias} -> ${alias.resolved}`);
                });

                jsonInput.categoryDescriptions.forEach(desc => {
                    categoryDescriptions.push(`- ${desc.name}: ${desc.description || "(x)"}`);
                });

                returnText = tr(lang, "availableCategories", jsonInput.categories.map(c => `- ${c}`).join("\n"), categoryAliases.join("\n"), categoryDescriptions.join("\n"));
            }

            //#SECTION endpoint /flags
            else if(jsonInput.flags)
            {
                let flagDescriptions = [];
                jsonInput.flagDescriptions.forEach(desc => {
                    flagDescriptions.push(`- ${desc.name}: ${desc.description || "(x)"}`);
                });

                returnText = tr(lang, "availableFlags", jsonInput.flags.join('", "'), flagDescriptions.join("\n"));
            }

            //#SECTION endpoint /ping
            else if(jsonInput.ping)
                returnText = `${jsonInput.ping}\n${tr(lang, "timestamp", jsonInput.timestamp)}`;

            //#SECTION endpoint /langcode
            else if(jsonInput.code)
                returnText = `${jsonInput.error ? tr(lang, "genericError", jsonInput.message) : tr(lang, "languageCode", jsonInput.code)}`;

            //#SECTION endpoint /languages
            else if(jsonInput.defaultLanguage)
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

            //#SECTION endpoint /info
            else if(jsonInput.version)
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
                                    suppLangs.sort().join(", "), sysLangs.length, sysLangs.sort().join(", "), safeJokesAmounts.join("\n"), jsonInput.serverLatency, jsonInput.info
                                );
            }

            //#SECTION endpoint /formats
            else if(jsonInput.formats && jsonInput.formatDescriptions)
            {
                let formatDescriptions = [];
                jsonInput.formatDescriptions.forEach(desc => {
                    formatDescriptions.push(`- ${desc.name}: ${desc.description || "(x)"}`);
                });

                returnText = tr(lang, "availableFormats", `"${jsonInput.formats.join('", "')}"`, formatDescriptions.join("\n"));
            }

            //#SECTION endpoint /endpoints
            else if(Array.isArray(jsonInput) && jsonInput[0].usage && jsonInput[0].usage.method)
            {
                returnText = "";
                jsonInput.forEach(ep => {
                    returnText += `${tr(lang, "endpointDetails", ep.name, ep.description, ep.usage.method, ep.usage.url, (ep.usage.supportedParams.length > 0 ? `"${ep.usage.supportedParams.join('", "')}"` : "X"))}\n\n`;
                });
            }
        }
    }

    return returnText;
}

module.exports = { auto, toYAML, toXML, toTXT };
