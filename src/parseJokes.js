// this module parses all the jokes to verify that they are valid and that their structure is not messed up

const fs = require("fs-extra");
const jsl = require("svjsl");

const settings = require("../settings");
const debug = require("./verboseLogging");
const languages = require("./languages");
const AllJokes = require("./classes/AllJokes");
const tr = require("./translate");


/**
 * @typedef {Object} CategoryAlias
 * @prop {String} alias Name of the alias
 * @prop {String} value The value this alias resolves to
 */

/** @type {CategoryAlias[]} */
var categoryAliases = [];
/** @type {number|undefined} */
let jokeFormatVersion;


/**
 * Parses all jokes
 * @returns {Promise<Boolean>}
 */
function init()
{
    return new Promise((resolve, reject) => {
        // prepare category aliases
        Object.keys(settings.jokes.possible.categoryAliases).forEach(alias => {
            let aliasResolved = settings.jokes.possible.categoryAliases[alias];

            if(!settings.jokes.possible.categories.includes(aliasResolved))
                return reject(`Error while setting up category aliases: The resolved value "${aliasResolved}" of alias "${alias}" is not present in the "settings.jokes.possible.categories" array.`);
            
            categoryAliases.push({ alias, value: aliasResolved });
        });

        debug("JokeParser", `Registered ${categoryAliases.length} category aliases`);


        // prepare jokes files
        let jokesFiles = fs.readdirSync(settings.jokes.jokesFolderPath);
        let result = [];
        let allJokesFilesObj = {};

        let outerPromises = [];

        let parsedJokesAmount = 0;

        jokesFiles.forEach(jf => {
            if(jf == settings.jokes.jokesTemplateFile)
                return;

            outerPromises.push(new Promise((resolveOuter, rejectOuter) => {
                jsl.unused(rejectOuter);

                let fileNameValid = (fileName) => {
                    if(!fileName.endsWith(".json"))
                        return false;
                    let spl1 = fileName.split(".json")[0];
                    if(spl1.includes("-") && languages.isValidLang(spl1.split("-")[1]) === true && spl1.split("-")[0] == "jokes")
                        return true;
                    return false;
                };

                let getLangCode = (fileName) => {
                    if(!fileName.endsWith(".json"))
                        return false;
                    let spl1 = fileName.split(".json")[0];
                    if(spl1.includes("-") && languages.isValidLang(spl1.split("-")[1]) === true)
                        return spl1.split("-")[1].toLowerCase();
                };

                let langCode = getLangCode(jf);

                if(!jf.endsWith(".json") || !fileNameValid(jf))
                    result.push(`${jsl.colors.fg.red}Error: Invalid file "${settings.jokes.jokesFolderPath}${jf}" found. It has to follow this pattern: "jokes-xy.json"`);


                fs.readFile(`${settings.jokes.jokesFolderPath}${jf}`, (err, jokesFile) => {
                    if(err)
                        return reject(err);

                    try
                    {
                        jokesFile = JSON.parse(jokesFile.toString());
                    }
                    catch(err)
                    {
                        return reject(`Error while parsing jokes file "${jf}" as JSON: ${err}`);
                    }

                    //#MARKER format version
                    if(jokesFile.info.formatVersion == settings.jokes.jokesFormatVersion)
                        result.push(true);
                    else result.push(`Joke file format version of language "${langCode}" is set to "${jokesFile.info.formatVersion}" - Expected: "${settings.jokes.jokesFormatVersion}"`);

                    jokesFile.jokes.forEach((joke, i) => {
                        //#MARKER joke ID
                        if(!jsl.isEmpty(joke.id) && !isNaN(parseInt(joke.id)))
                            result.push(true);
                        else result.push(`Joke with index/ID ${i} of language "${langCode}" doesn't have an "id" property or it is invalid`);

                        //#MARKER category
                        if(settings.jokes.possible.categories.map(c => c.toLowerCase()).includes(joke.category.toLowerCase()))
                            result.push(true);
                        else
                            result.push(`Joke with index/ID ${i} of language "${langCode}" has an invalid category (Note: aliases are not allowed here)`);

                        //#MARKER type and actual joke
                        if(joke.type == "single")
                        {
                            if(!jsl.isEmpty(joke.joke))
                                result.push(true);
                            else result.push(`Joke with index/ID ${i} of language "${langCode}" doesn't have a "joke" property`);
                        }
                        else if(joke.type == "twopart")
                        {
                            if(!jsl.isEmpty(joke.setup))
                                result.push(true);
                            else result.push(`Joke with index/ID ${i} of language "${langCode}" doesn't have a "setup" property`);

                            if(!jsl.isEmpty(joke.delivery))
                                result.push(true);
                            else result.push(`Joke with index/ID ${i} of language "${langCode}" doesn't have a "delivery" property`);
                        }
                        else result.push(`Joke with index/ID ${i} of language "${langCode}" doesn't have a "type" property or it is invalid`);

                        //#MARKER flags
                        if(!jsl.isEmpty(joke.flags))
                        {
                            if(!jsl.isEmpty(joke.flags.nsfw) || (joke.flags.nsfw !== false && joke.flags.nsfw !== true))
                                result.push(true);
                            else result.push(`Joke with index/ID ${i} of language "${langCode}" has an invalid "NSFW" flag`);

                            if(!jsl.isEmpty(joke.flags.racist) || (joke.flags.racist !== false && joke.flags.racist !== true))
                                result.push(true);
                            else result.push(`Joke with index/ID ${i} of language "${langCode}" has an invalid "racist" flag`);

                            if(!jsl.isEmpty(joke.flags.sexist) || (joke.flags.sexist !== false && joke.flags.sexist !== true))
                                result.push(true);
                            else result.push(`Joke with index/ID ${i} of language "${langCode}" has an invalid "sexist" flag`);

                            if(!jsl.isEmpty(joke.flags.political) || (joke.flags.political !== false && joke.flags.political !== true))
                                result.push(true);
                            else result.push(`Joke with index/ID ${i} of language "${langCode}" has an invalid "political" flag`);

                            if(!jsl.isEmpty(joke.flags.religious) || (joke.flags.religious !== false && joke.flags.religious !== true))
                                result.push(true);
                            else result.push(`Joke with index/ID ${i} of language "${langCode}" has an invalid "religious" flag`);

                            if(!jsl.isEmpty(joke.flags.explicit) || (joke.flags.explicit !== false && joke.flags.explicit !== true))
                                result.push(true);
                            else result.push(`Joke with index/ID ${i} of language "${langCode}" has an invalid "explicit" flag`);
                        }
                        else result.push(`Joke with index/ID ${i} of language "${langCode}" doesn't have a "flags" object or it is invalid`);

                        parsedJokesAmount++;
                    });

                    allJokesFilesObj[langCode] = jokesFile;
                    return resolveOuter();
                });
            }));
        });

        Promise.all(outerPromises).then(() => {
            let errors = [];

            result.forEach(res => {
                if(typeof res === "string")
                    errors.push(res);
            });

            let allJokesObj = new AllJokes(allJokesFilesObj);

            let formatVersions = [settings.jokes.jokesFormatVersion];
            languages.jokeLangs().map(jl => jl.code).sort().forEach(lang => {
                formatVersions.push(allJokesObj.getFormatVersion(lang));
            });

            if(!jsl.allEqual(formatVersions))
                errors.push("One or more of the jokes files has an invalid format version");

            module.exports.allJokes = allJokesObj;
            module.exports.jokeCount = allJokesObj.getJokeCount();
            module.exports.jokeCountPerLang = allJokesObj.getJokeCountPerLang();
            module.exports.safeJokes = allJokesObj.getSafeJokes();

            let fmtVer = allJokesObj.getFormatVersion("en");
            module.exports.jokeFormatVersion = fmtVer;
            jokeFormatVersion = fmtVer;


            debug("JokeParser", `Done parsing all ${parsedJokesAmount} jokes. Errors: ${errors.length === 0 ? jsl.colors.fg.green : jsl.colors.fg.red}${errors.length}${jsl.colors.rst}`);

            if(jsl.allEqual(result) && result[0] === true && errors.length === 0)
                return resolve();
            
            return reject(`Errors:\n- ${errors.join("\n- ")}`);
        }).catch(err => {
            return reject(err);
        });
    });
}

/**
 * @typedef {"Misc"|"Programming"|"Dark"|"Pun"|"Spooky"|"Christmas"} JokeCategory Resolved category name (not an alias)
 */
/**
 * @typedef {"Miscellaneous"|"Coding"|"Development"|"Halloween"} JokeCategoryAlias Category name aliases
 */

/**
 * @typedef {Object} SingleJoke A joke of type single
 * @prop {JokeCategory} category The category of the joke
 * @prop {"single"} type The type of the joke
 * @prop {String} joke The joke itself
 * @prop {Object} flags
 * @prop {Boolean} flags.nsfw Whether the joke is NSFW or not
 * @prop {Boolean} flags.racist Whether the joke is racist or not
 * @prop {Boolean} flags.religious Whether the joke is religiously offensive or not
 * @prop {Boolean} flags.political Whether the joke is politically offensive or not
 * @prop {Boolean} flags.explicit Whether the joke contains explicit language
 * @prop {Number} id The ID of the joke
 * @prop {String} lang The language of the joke
 */

/**
 * @typedef {Object} TwopartJoke A joke of type twopart
 * @prop {JokeCategory} category The category of the joke
 * @prop {"twopart"} type The type of the joke
 * @prop {String} setup The setup of the joke
 * @prop {String} delivery The delivery of the joke
 * @prop {Object} flags
 * @prop {Boolean} flags.nsfw Whether the joke is NSFW or not
 * @prop {Boolean} flags.racist Whether the joke is racist or not
 * @prop {Boolean} flags.religious Whether the joke is religiously offensive or not
 * @prop {Boolean} flags.political Whether the joke is politically offensive or not
 * @prop {Boolean} flags.explicit Whether the joke contains explicit language
 * @prop {Number} id The ID of the joke
 * @prop {String} lang The language of the joke
 */

/**
 * Validates a single joke passed as a parameter
 * @param {(SingleJoke|TwopartJoke)} joke A joke object of type single or twopart
 * @param {String} lang Language code
 * @returns {(Boolean|Array<String>)} Returns true if the joke has the correct format, returns string array containing error(s) if invalid
 */
function validateSingle(joke, lang)
{
    let jokeErrors = [];

    if(languages.isValidLang(lang) !== true)
        jokeErrors.push(tr(lang, "parseJokesInvalidLanguageCode"));


    // reserialize object
    if(typeof joke == "object")
        joke = JSON.stringify(joke);

    joke = JSON.parse(joke);


    // TODO: version 2.3.2:
    // let jokeObj = {
    //     "formatVersion": true,
    //     "category": true,
    //     "type": true,
    // };

    // if(joke.type == "single")
    //     jokeObj.joke = true;
    // else if(joke.type == "twopart")
    // {
    //     jokeObj.setup = true;
    //     jokeObj.delivery = true;
    // }

    // jokeObj = {
    //     ...jokeObj,
    //     flags: {
    //         nsfw: true,
    //         religious: true,
    //         political: true,
    //         racist: true,
    //         sexist: true
    //     },
    //     lang: true
    // }


    try
    {
        //#MARKER format version
        if(joke.formatVersion != null)
        {
            if(joke.formatVersion != settings.jokes.jokesFormatVersion || joke.formatVersion != jokeFormatVersion)
            {
                jokeErrors.push(tr(lang, "parseJokesFormatVersionMismatch", joke.formatVersion, jokeFormatVersion));
                // jokeObj.formatVersion = false; // TODO: version 2.3.2: repeat this for everything below
            }
        }
        else jokeErrors.push(tr(lang, "parseJokesNoFormatVersionOrInvalid"));

        //#MARKER type and actual joke
        if(joke.type == "single")
        {
            if(jsl.isEmpty(joke.joke))
                jokeErrors.push(tr(lang, "parseJokesSingleNoJokeProperty"));
        }
        else if(joke.type == "twopart")
        {
            if(jsl.isEmpty(joke.setup))
                jokeErrors.push(tr(lang, "parseJokesTwopartNoSetupProperty"));

            if(jsl.isEmpty(joke.delivery))
                jokeErrors.push(tr(lang, "parseJokesTwopartNoDeliveryProperty"));
        }
        else jokeErrors.push(tr(lang, "parseJokesNoTypeProperty"));

        //#MARKER joke category
        let jokeCat = typeof joke.category === "string" ? resolveCategoryAlias(joke.category) : joke.category;

        if(joke.category == null)
            jokeErrors.push(tr(lang, "parseJokesNoCategoryProperty"));
        else if(typeof jokeCat !== "string")
            jokeErrors.push(tr(lang, "parseJokesInvalidCategory"));
        else
        {
            let categoryValid = false;
            settings.jokes.possible.categories.forEach(cat => {
                if(jokeCat.toLowerCase() === cat.toLowerCase())
                    categoryValid = true;
            });
            if(!categoryValid)
                jokeErrors.push(tr(lang, "parseJokesInvalidCategory"));
        }

        //#MARKER flags
        if(!jsl.isEmpty(joke.flags))
        {
            if(jsl.isEmpty(joke.flags.nsfw) || (joke.flags.nsfw !== false && joke.flags.nsfw !== true))
                jokeErrors.push(tr(lang, "parseJokesNoFlagNsfw"));

            if(jsl.isEmpty(joke.flags.racist) || (joke.flags.racist !== false && joke.flags.racist !== true))
                jokeErrors.push(tr(lang, "parseJokesNoFlagRacist"));
            
            if(jsl.isEmpty(joke.flags.sexist) || (joke.flags.sexist !== false && joke.flags.sexist !== true))
                jokeErrors.push(tr(lang, "parseJokesNoFlagSexist"));

            if(jsl.isEmpty(joke.flags.political) || (joke.flags.political !== false && joke.flags.political !== true))
                jokeErrors.push(tr(lang, "parseJokesNoFlagPolitical"));

            if(jsl.isEmpty(joke.flags.religious) || (joke.flags.religious !== false && joke.flags.religious !== true))
                jokeErrors.push(tr(lang, "parseJokesNoFlagReligious"));

            if(jsl.isEmpty(joke.flags.explicit) || (joke.flags.explicit !== false && joke.flags.explicit !== true))
                jokeErrors.push(tr(lang, "parseJokesNoFlagExplicit"));
        }
        else jokeErrors.push(tr(lang, "parseJokesNoFlagsObject"));

        //#MARKER lang
        if(jsl.isEmpty(joke.lang))
            jokeErrors.push(tr(lang, "parseJokesNoLangProperty"));
        
        let langV = languages.isValidLang(joke.lang, lang);
        if(typeof langV === "string")
            jokeErrors.push(tr(lang, "parseJokesLangPropertyInvalid", langV));
        else if(langV !== true)
            jokeErrors.push(tr(lang, "parseJokesNoLangProperty"));
    }
    catch(err)
    {
        jokeErrors.push(tr(lang, "parseJokesCantParse", err.toString()));
    }

    if(jsl.isEmpty(jokeErrors))
        return true;
    else
        return jokeErrors;
}

/**
 * Returns the resolved value of a joke category alias or returns the initial value if it isn't an alias or is invalid
 * @param {JokeCategory|JokeCategoryAlias} category A singular joke category or joke category alias
 * @returns {JokeCategory}
 */
function resolveCategoryAlias(category)
{
    let cat = category;
    categoryAliases.forEach(catAlias => {
        if(typeof category !== "string")
            throw new TypeError(`Can't resolve category alias because '${category}' is not of type string`);

        if(category.toLowerCase() == catAlias.alias.toLowerCase())
            cat = catAlias.value;
    });

    return cat;
}

/**
 * Returns the resolved values of an array of joke category aliases or returns the initial values if there are none
 * @param {JokeCategory[]|JokeCategoryAlias[]} categories An array of joke categories (can contain aliases)
 * @returns {JokeCategory[]}
 */
function resolveCategoryAliases(categories)
{
    return categories.map(cat => resolveCategoryAlias(cat));
}

module.exports = { init, validateSingle, resolveCategoryAlias, resolveCategoryAliases };
