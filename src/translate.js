const fs = require("fs-extra");
const { unused } = require("svcorelib");

const debug = require("./debug");

const settings = require("../settings");


/** @typedef {import("./classes/FilterComponentEndpoint").FilterComponentName} FilterComponentName */
/** @typedef {import("svcorelib").Stringifiable} Stringifiable */


var trFile = {};
var filterCompTrFile = {};

/**
 * Initializes the translation module by caching the translations so they only need to be read from disk once
 * @returns {Promise}
 */
function init()
{
    debug("Translate", `Initializing - loading translations from "${settings.languages.translationsFile}"`);
    return new Promise(async (pRes, pRej) => {
        try
        {
            const generalFileCont = await fs.readFile(settings.languages.translationsFile);
            trFile = JSON.parse(generalFileCont.toString());

            debug("Translate", `Found ${Object.keys(trFile.tr).length} general translations`);


            const filterCompFileCont = await fs.readFile(settings.jokes.possible.filterComponentTranslationFile);
            filterCompTrFile = JSON.parse(filterCompFileCont.toString());

            debug("Translate", `Found ${Object.keys(filterCompTrFile.tr).length} filter component translations`);

            return pRes();
        }
        catch(err)
        {
            return pRej(`Error while reading translations file: ${err}`);
        }
    });
}

/**
 * Returns the translation of a sentence of a specified language.
 * @param {string} lang Language code - Validate this yourself as this function can't do it due to circular dependencies!
 * @param {string} id The name of the translation node
 * @param {...Stringifiable} args Arguments to replace numbered %-placeholders with. Only use values that are strings or convertable to them with `.toString()`
 * @returns {string|null} Returns `null` if no translation is available. Else returns a string
 */
function translate(lang, id, ...args)
{
    try
    {
        if(!lang)
            lang = settings.languages.defaultLanguage;

        const langTr = trFile.tr[id];
        if(!langTr)
            return null;

        let translation = langTr[lang.toString().toLowerCase()];
        if(!translation)
            translation = langTr[settings.languages.defaultLanguage];
        
        translation = translation.toString();

        if(Array.isArray(args) && translation.includes("%"))
        {
            args.forEach((arg, i) => {
                const rex = new RegExp(`%${i + 1}`);
                if(translation.match(rex))
                {
                    try
                    {
                        translation = translation.replace(rex, (typeof arg === "string" ? arg : arg.toString()));
                    }
                    catch(err)
                    {
                        unused(err);
                    }
                }
            });
        }

        // debug("Translate", `Translating "${id}" into ${lang} - result: ${translation}`);

        return translation || null;
    }
    catch(err)
    {
        unused(err);
        return null;
    }
}

/**
 * Returns the translated description of a filter component
 * @param {string} lang The language code - Validate this yourself as this function can't do it due to circular dependencies!
 * @param {FilterComponentName} component The component to get the description of
 * @param {string} key The key of the component to get the description of
 * @returns {string|null}
 */
function getFilterComponentDescription(lang, component, key)
{
    try
    {
        if(!lang)
            lang = settings.languages.defaultLanguage;

        const compKeys = filterCompTrFile.tr[component];
        if(!compKeys)
            return null;

        const compVals = compKeys[key];
        if(!compVals)
            return null;

        const translation = compVals[lang.toLowerCase()];

        return translation || null;
    }
    catch(err)
    {
        unused(err);
        return null;
    }
}

/**
 * Returns a list of system languages present in the general translations file (2 char code)
 * @returns {string[]}
 */
function systemLangs()
{
    return trFile.languages;
}

module.exports = translate;
module.exports.init = init;
module.exports.systemLangs = systemLangs;
module.exports.getFilterComponentDescription = getFilterComponentDescription;
