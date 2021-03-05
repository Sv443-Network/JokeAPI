const fs = require("fs-extra");
const jsl = require("svjsl");
const Fuse = require("fuse.js");

const debug = require("./verboseLogging");
const tr = require("./translate");

const settings = require("../settings");

/** Filled out when the `init()` function is called. Contains all language codes and language names. */
var langs = {};

/**
 * Initializes the language module
 * @returns {Promise} Resolves with the amount of loaded languages
 */
function init()
{
    debug("Languages", `Initializing - loading languages from "${settings.languages.langFilePath}"`);
    return new Promise((pRes, pRej) => {
        fs.readFile(settings.languages.langFilePath, (err, data) => {
            if(err)
                return pRej(err);

            const languages = JSON.parse(data.toString());
            const langsAmount = Object.keys(languages).length;

            langs = languages;

            debug("Languages", `Found ${langsAmount} languages`);

            return pRes(langsAmount);
        });
    });
}

/**
 * Checks whether or not a provided language code is ISO 639-1 or ISO 639-2 compatible
 * @param {String} langCode Two-character language code
 * @param {String} [trLang] For translating the error messages
 * @returns {Boolean|String} Returns `true` if code exists, string with error message if not
 */
function isValidLang(langCode, trLang)
{
    // if trLang not provided or it was provided but is invalid, reset to default lang
    if(trLang != "string" || (typeof trLang == "string" && isValidLang(trLang) !== true))
        trLang = settings.languages.defaultLanguage;

    if(langs == undefined)
        return tr(trLang, "langModuleInitError");

    if(typeof langCode !== "string" || langCode.length !== 2)
        return tr(trLang, "langCodeInvalidValue");

    const requested = langs[langCode.toLowerCase()];

    if(typeof requested === "string")
        return true;
    else
        return tr(trLang, "langCodeDoesntExist");
}

/**
 * Converts a language name (fuzzy) into an ISO 639-1 or ISO 639-2 compatible lang code
 * @param {string} language
 * @returns {soolean|string} Returns `false` if no matching language code was found, else returns string with language code
 */
function languageToCode(language)
{
    if(langs == undefined)
        throw new Error("INTERNAL_ERROR: Language module was not correctly initialized (yet)");

    if(typeof language !== "string" || language.length < 0)
        throw new TypeError("Language is not a string or it is empty");

    const searchObj = [];

    Object.keys(langs).forEach(key => {
        searchObj.push({
            code: key,
            lang: langs[key].toLowerCase()
        });
    });

    const fuzzy = new Fuse(searchObj, {
        includeScore: true,
        keys: ["code", "lang"],
        threshold: settings.languages.fuzzySearchThreshold
    });

    let result = fuzzy.search(language)[0];

    if(result)
        return result.item.code;
    else
        return false;
}

/**
 * Converts an ISO 639-1 or ISO 639-2 compatible lang code into a language name
 * @param {string} code
 * @returns {boolean|string} Returns `false` if no matching language was found, else returns string with language name
 */
function codeToLanguage(code)
{
    try
    {
        return langs[code] || false;
    }
    catch(err)
    {
        jsl.unused(err);
        return false;
    }
}

/**
 * @typedef {Object} SupLangObj
 * @prop {string} code
 * @prop {string} name
 */

/**
 * Returns a list of languages that jokes are available from
 * @returns {SupLangObj[]}
 */
function jokeLangs()
{
    let retLangs = [];

    fs.readdirSync(settings.jokes.jokesFolderPath).forEach(f => {
        if(f == settings.jokes.jokesTemplateFile)
            return;

        let langCode = f.split("-")[1].substr(0, 2);

        retLangs.push({
            code: langCode,
            name: codeToLanguage(langCode)
        });
    });

    return retLangs;
}

/**
 * Returns a list of languages that error messages and maybe other stuff are available as
 * @returns {SupLangObj[]}
 */
function systemLangs()
{
    return tr.systemLangs();
}

/**
 * Returns all possible language codes
 * @returns {string[]}
 */
function getPossibleCodes()
{
    return Object.keys(langs);
}

/**
 * Returns all possible languages, mapped as an object where keys are codes and values are language names
 * @returns {Object}
 */
function getPossibleLanguages()
{
    return langs;
}

module.exports = {
    init,
    isValidLang,
    languageToCode,
    codeToLanguage,
    jokeLangs,
    systemLangs,
    getPossibleCodes,
    getPossibleLanguages
};
