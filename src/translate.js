// This module handles general translations (endpoint translations, splashes, etc. are located elsewhere)

const fs = require("fs-extra");
const { unused } = require("svcorelib");

const debug = require("./debug");

const settings = require("../settings");


/** @typedef {import("svcorelib").Stringifiable} Stringifiable */
/** @typedef {import("../data/translations/endpoints.json")} EndpointsTrFile */
/** @typedef {import("./classes/FilterComponentEndpoint").FilterComponentName} FilterComponentName */


/** @type {import("../data/translations/general.json")} */
let trFile = {};
/** @type {import("../data/translations/filterComponents.json")} */
let filterCompTrFile = {};
/** @type {import("../data/translations/endpoints.json")} */
let endpointsTrFile = {};

/** Whether this module was initialized */
let initialized = false;

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

            debug("Translate", `Registered ${Object.keys(trFile.tr).length} general translation nodes`, "green");


            const filterCompFileCont = await fs.readFile(settings.jokes.possible.filterComponentTranslationFile);
            filterCompTrFile = JSON.parse(filterCompFileCont.toString());

            debug("Translate", `Registered translations for ${Object.keys(filterCompTrFile.tr).length} filter components`, "green");

            await initEndpointTranslations();

            debug("Translate", "Initialized endpoint translations");

            initialized = true;

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
        if(!initialized)
            throw new Error("translate module isnt't initialized");

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

/**
 * Initializes the endpoint translations
 * @returns {Promise<void, string>}
 */
function initEndpointTranslations()
{
    return new Promise(async (res, rej) => {
        try
        {
            endpointsTrFile = JSON.parse((await fs.readFile(settings.endpoints.translationsFile)).toString());

            return res();
        }
        catch(err)
        {
            return rej(`Error while initializing endpoint translations: ${err}`);
        }
    });
}

/**
 * Returns the contents of the endpoints translation file
 * @returns {EndpointsTrFile}
 */
function getEndpointsTranslationFile()
{
    return endpointsTrFile;
}

module.exports = translate;
module.exports.init = init;
module.exports.systemLangs = systemLangs;
module.exports.getFilterComponentDescription = getFilterComponentDescription;
module.exports.getEndpointsTranslationFile = getEndpointsTranslationFile;
