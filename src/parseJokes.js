// this module parses all the jokes to verify that they are valid and that their structure is not messed up

const fs = require("fs-extra");
const { unused, isEmpty, allEqual, colors, reserialize } = require("svcorelib");

const settings = require("../settings");
const debug = require("./debug");
const languages = require("./languages");
const AllJokes = require("./classes/AllJokes");
const tr = require("./translate");


//#MARKER types
/**
 * @typedef {Object} CategoryAliasObj
 * @prop {String} alias Name of the alias
 * @prop {String} value The value this alias resolves to
 */

/**
 * @typedef {"Misc"|"Programming"|"Dark"|"Pun"|"Spooky"|"Christmas"} JokeCategory Resolved category name (not an alias)
 */
/**
 * @typedef {"Miscellaneous"|"Coding"|"Development"|"Halloween"} JokeCategoryAlias Category name aliases
 */

/**
 * @typedef {SingleJoke|TwopartJoke} Joke An internal joke object (not a submission) that matches the "single" or "twopart" format
 */

/**
 * @typedef {object} SingleJoke A joke of type single
 * @prop {JokeCategory} category The category of the joke
 * @prop {"single"} type The type of the joke
 * @prop {string} joke The joke itself
 * @prop {Object} flags
 * @prop {boolean} flags.nsfw Whether the joke is NSFW or not
 * @prop {boolean} flags.racist Whether the joke is racist or not
 * @prop {boolean} flags.religious Whether the joke is religiously offensive or not
 * @prop {boolean} flags.political Whether the joke is politically offensive or not
 * @prop {boolean} flags.explicit Whether the joke contains explicit language
 * @prop {number} id The ID of the joke
 * @prop {string} lang The language of the joke
 * @prop {boolean} safe Whether this joke is safe or not
 */

/**
 * @typedef {object} TwopartJoke A joke of type twopart
 * @prop {JokeCategory} category The category of the joke
 * @prop {"twopart"} type The type of the joke
 * @prop {string} setup The setup of the joke
 * @prop {string} delivery The delivery of the joke
 * @prop {Object} flags
 * @prop {boolean} flags.nsfw Whether the joke is NSFW or not
 * @prop {boolean} flags.racist Whether the joke is racist or not
 * @prop {boolean} flags.religious Whether the joke is religiously offensive or not
 * @prop {boolean} flags.political Whether the joke is politically offensive or not
 * @prop {boolean} flags.explicit Whether the joke contains explicit language
 * @prop {number} id The ID of the joke
 * @prop {string} lang The language of the joke
 * @prop {boolean} safe Whether this joke is safe or not
 */

/**
 * @typedef {object} JokeSubmissionParams
 * @prop {boolean} formatVersion Version of the joke format
 * @prop {boolean} category The category of the joke
 * @prop {boolean} type The type of the joke
 * @prop {boolean} [joke] The actual joke [when type=single]
 * @prop {boolean} [setup] The setup of the joke [when type=twopart]
 * @prop {boolean} [delivery] The delivery of the joke [when type=twopart]
 * @prop {Object} flags
 * @prop {boolean} flags.nsfw Whether the joke is NSFW or not
 * @prop {boolean} flags.racist Whether the joke is racist or not
 * @prop {boolean} flags.religious Whether the joke is religiously offensive or not
 * @prop {boolean} flags.political Whether the joke is politically offensive or not
 * @prop {boolean} flags.explicit Whether the joke contains explicit language
 * @prop {boolean} lang The language of the joke
 */

/**
 * @typedef {Object} ValidationResult
 * @prop {boolean} valid Whether or not this joke's format is valid
 * @prop {string[]} errorStrings Array of error strings
 * @prop {JokeSubmissionParams|null} jokeParams An object describing all valid and invalid parameters - If set to `null`, the joke couldn't be parsed (invalid JSON)
 */

/** @type {CategoryAliasObj[]} */
const categoryAliases = [];

/** @type {number} */
let globalFormatVersion = 0;


//#MARKER init
/**
 * Parses all jokes
 * @returns {Promise<void>} Resolves with no parameters if initialization was successful or rejects with an error message
 */
function init()
{
    return new Promise((resolve, reject) => {
        // prepare category aliases
        Object.keys(settings.jokes.possible.categoryAliases).forEach(alias => {
            const aliasResolved = settings.jokes.possible.categoryAliases[alias];

            if(!settings.jokes.possible.categories.includes(aliasResolved))
                return reject(`Error while setting up category aliases: The resolved value "${aliasResolved}" of alias "${alias}" is not present in the "settings.jokes.possible.categories" array.`);
            
            categoryAliases.push({ alias, value: aliasResolved });
        });

        debug("JokeParser", `Registered ${categoryAliases.length} category aliases`, "green");


        // prepare jokes files
        const jokesFiles = fs.readdirSync(settings.jokes.jokesFolderPath);
        const result = [];
        const allJokesFilesObj = {};

        const outerPromises = [];

        let parsedJokesAmount = 0;

        jokesFiles.forEach(jf => {
            if(jf == settings.jokes.jokesTemplateFile)
                return;

            outerPromises.push(new Promise((resolveOuter, rejectOuter) => {
                unused(rejectOuter);

                const fileNameValid = (fileName) => {
                    if(!fileName.endsWith(".json"))
                        return false;
                    let spl1 = fileName.split(".json")[0];
                    if(spl1.includes("-") && languages.isValidLang(spl1.split("-")[1]) && spl1.split("-")[0] == "jokes")
                        return true;
                    return false;
                };

                const getLangCode = (fileName) => {
                    if(!fileName.endsWith(".json"))
                        return false;
                    let spl1 = fileName.split(".json")[0];
                    if(spl1.includes("-") && languages.isValidLang(spl1.split("-")[1]))
                        return spl1.split("-")[1].toLowerCase();
                };

                const langCode = getLangCode(jf);

                if(!jf.endsWith(".json") || !fileNameValid(jf))
                    result.push(`${colors.fg.red}Error: Invalid file "${settings.jokes.jokesFolderPath}${jf}" found. It has to follow this pattern: "jokes-xy.json"`);


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

                    //#SECTION format version
                    if(jokesFile.info.formatVersion == settings.jokes.jokesFormatVersion)
                        result.push(true);
                    else result.push(`Joke file format version of language "${langCode}" is set to "${jokesFile.info.formatVersion}" - Expected: "${settings.jokes.jokesFormatVersion}"`);

                    jokesFile.jokes.forEach((joke, i) => {
                        //#SECTION joke ID
                        if(!isEmpty(joke.id) && !isNaN(parseInt(joke.id)))
                            result.push(true);
                        else result.push(`Joke with index/ID ${i} of language "${langCode}" doesn't have an "id" property or it is invalid`);

                        //#SECTION category
                        if(settings.jokes.possible.categories.map(c => c.toLowerCase()).includes(joke.category.toLowerCase()))
                            result.push(true);
                        else
                            result.push(`Joke with index/ID ${i} of language "${langCode}" has an invalid category (Note: aliases are not allowed here)`);

                        //#SECTION type and actual joke
                        if(joke.type == "single")
                        {
                            if(!isEmpty(joke.joke))
                                result.push(true);
                            else result.push(`Joke with index/ID ${i} of language "${langCode}" doesn't have a "joke" property`);
                        }
                        else if(joke.type == "twopart")
                        {
                            if(!isEmpty(joke.setup))
                                result.push(true);
                            else result.push(`Joke with index/ID ${i} of language "${langCode}" doesn't have a "setup" property`);

                            if(!isEmpty(joke.delivery))
                                result.push(true);
                            else result.push(`Joke with index/ID ${i} of language "${langCode}" doesn't have a "delivery" property`);
                        }
                        else result.push(`Joke with index/ID ${i} of language "${langCode}" doesn't have a "type" property or it is invalid`);

                        //#SECTION flags
                        if(!isEmpty(joke.flags))
                        {
                            if(!isEmpty(joke.flags.nsfw) || (joke.flags.nsfw !== false && joke.flags.nsfw !== true))
                                result.push(true);
                            else result.push(`Joke with index/ID ${i} of language "${langCode}" has an invalid "NSFW" flag`);

                            if(!isEmpty(joke.flags.racist) || (joke.flags.racist !== false && joke.flags.racist !== true))
                                result.push(true);
                            else result.push(`Joke with index/ID ${i} of language "${langCode}" has an invalid "racist" flag`);

                            if(!isEmpty(joke.flags.sexist) || (joke.flags.sexist !== false && joke.flags.sexist !== true))
                                result.push(true);
                            else result.push(`Joke with index/ID ${i} of language "${langCode}" has an invalid "sexist" flag`);

                            if(!isEmpty(joke.flags.political) || (joke.flags.political !== false && joke.flags.political !== true))
                                result.push(true);
                            else result.push(`Joke with index/ID ${i} of language "${langCode}" has an invalid "political" flag`);

                            if(!isEmpty(joke.flags.religious) || (joke.flags.religious !== false && joke.flags.religious !== true))
                                result.push(true);
                            else result.push(`Joke with index/ID ${i} of language "${langCode}" has an invalid "religious" flag`);

                            if(!isEmpty(joke.flags.explicit) || (joke.flags.explicit !== false && joke.flags.explicit !== true))
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
            const errors = [];

            result.forEach(res => {
                if(typeof res === "string")
                    errors.push(res);
            });

            const allJokesObj = new AllJokes(allJokesFilesObj);

            const formatVersions = [settings.jokes.jokesFormatVersion];
            languages.jokeLangs().map(jl => jl.code).sort().forEach(lang => {
                formatVersions.push(allJokesObj.getFormatVersion(lang));
            });

            if(!allEqual(formatVersions))
                errors.push(`One or more of the jokes files has an invalid format version`);

            module.exports.allJokes = allJokesObj;
            module.exports.jokeCount = allJokesObj.getJokeCount();
            module.exports.jokeCountPerLang = allJokesObj.getJokeCountPerLang();
            module.exports.safeJokes = allJokesObj.getSafeJokes();

            const fmtVer = allJokesObj.getFormatVersion("en");
            module.exports.jokeFormatVersion = fmtVer;
            globalFormatVersion = fmtVer;


            debug("JokeParser", `Done parsing all ${colors.fg.green}${parsedJokesAmount}${colors.rst} jokes. Errors: ${errors.length === 0 ? colors.fg.green : colors.fg.red}${errors.length}${colors.rst}`, "green");

            if(allEqual(result) && result[0] === true && errors.length === 0)
                return resolve();

            return reject(`Errors:\n- ${errors.join("\n- ")}`);
        }).catch(err => {
            return reject(err);
        });
    });
}

//#MARKER validate single
/**
 * Validates a joke submission
 * @param {SingleJoke|TwopartJoke|string} joke A joke object of type single or twopart (plus the `formatVersion` prop) - also accepts a stringified object
 * @param {string} lang Language code
 * @returns {ValidationResult}
 * @version 2.4.0 Changed return value (to implement issue #209)
 */
function validateSubmission(joke, lang)
{
    const jokeErrors = [];

    try
    {
        // if submission is a string, parse and freeze it
        // if it's an object, reserialize it to lose reference and also freeze it
        if(typeof joke === "string")
            joke = Object.freeze(JSON.parse(joke));
        else if(typeof joke === "object")
            joke = reserialize(joke, true);
        else
            throw new TypeError(`Error while validating submission: Expected 'joke' to be of type object or string but got '${typeof joke}' instead`);
    }
    catch(err)
    {
        jokeErrors.push(tr(lang, "parseJokesCantParseJson"));
    }


    /**
     * Returns the parameter validity object needed in the returned object of validateSubmission()
     * @param {SingleJoke|TwopartJoke} jokeObj
     * @returns {JokeSubmissionParams}
     */
    const getParamValidityObj = (jokeObj) => {
        let validParamsObj = {
            formatVersion: true,
            category: true,
            type: true
        };
    
        if(jokeObj.type === "twopart")
        {
            validParamsObj.setup = true;
            validParamsObj.delivery = true;
        }
        else if(jokeObj.type === "single")
            validParamsObj.joke = true;
        else
        {
            validParamsObj.type = false;
            validParamsObj.joke = false;
        }
    
        validParamsObj = {
            ...validParamsObj,
            flags: {
                nsfw: true,
                religious: true,
                political: true,
                racist: true,
                sexist: true
            },
            lang: true
        }

        return validParamsObj;
    };

    /** Object resembling a joke submission but all values are booleans describing the validity of that property */
    const validParamsObj = getParamValidityObj(joke);

    try
    {
        //#SECTION lang code
        if(!languages.isValidLang(lang))
            jokeErrors.push(tr(lang, "parseJokesInvalidLanguageCode"));

        //#SECTION format version
        if(joke.formatVersion != null)
        {
            if(joke.formatVersion != settings.jokes.jokesFormatVersion || joke.formatVersion != globalFormatVersion)
            {
                jokeErrors.push(tr(lang, "parseJokesFormatVersionMismatch", joke.formatVersion, globalFormatVersion));
                validParamsObj.formatVersion = false;
            }
        }
        else
        {
            jokeErrors.push(tr(lang, "parseJokesNoFormatVersionOrInvalid"));
            validParamsObj.formatVersion = false;
        }

        //#SECTION type and actual joke
        if(joke.type == "single")
        {
            if(isEmpty(joke.joke))
            {
                jokeErrors.push(tr(lang, "parseJokesSingleNoJokeProperty"));
                validParamsObj.joke = false;
            }
        }
        else if(joke.type == "twopart")
        {
            if(isEmpty(joke.setup))
            {
                jokeErrors.push(tr(lang, "parseJokesTwopartNoSetupProperty"));
                validParamsObj.setup = false;
            }

            if(isEmpty(joke.delivery))
            {
                jokeErrors.push(tr(lang, "parseJokesTwopartNoDeliveryProperty"));
                validParamsObj.delivery = false;
            }
        }
        else
            jokeErrors.push(tr(lang, "parseJokesNoTypeProperty"));

        //#SECTION joke category
        let jokeCat = resolveCategoryAlias(joke.category);

        if(!jokeCat)
        {
            jokeErrors.push(tr(lang, "parseJokesNoCategoryProperty"));
            validParamsObj.category = false;
        }
        else
        {
            let categoryValid = false;
            settings.jokes.possible.categories.forEach(cat => {
                if(jokeCat.toLowerCase() == cat.toLowerCase())
                    categoryValid = true;
            });
            
            if(!categoryValid)
            {
                jokeErrors.push(tr(lang, "parseJokesInvalidCategory"));
                validParamsObj.category = false;
            }
        }

        //#SECTION flags
        if(!isEmpty(joke.flags))
        {
            if(isEmpty(joke.flags.nsfw) || (joke.flags.nsfw !== false && joke.flags.nsfw !== true))
            {
                jokeErrors.push(tr(lang, "parseJokesNoFlagNsfw"));
                validParamsObj.flags.nsfw = false;
            }

            if(isEmpty(joke.flags.racist) || (joke.flags.racist !== false && joke.flags.racist !== true))
            {
                jokeErrors.push(tr(lang, "parseJokesNoFlagRacist"));
                validParamsObj.flags.racist = false;
            }
            
            if(isEmpty(joke.flags.sexist) || (joke.flags.sexist !== false && joke.flags.sexist !== true))
            {
                jokeErrors.push(tr(lang, "parseJokesNoFlagSexist"));
                validParamsObj.flags.sexist = false;
            }

            if(isEmpty(joke.flags.political) || (joke.flags.political !== false && joke.flags.political !== true))
            {
                jokeErrors.push(tr(lang, "parseJokesNoFlagPolitical"));
                validParamsObj.flags.political = false;
            }

            if(isEmpty(joke.flags.religious) || (joke.flags.religious !== false && joke.flags.religious !== true))
            {
                jokeErrors.push(tr(lang, "parseJokesNoFlagReligious"));
                validParamsObj.flags.religious = false;
            }

            if(isEmpty(joke.flags.explicit) || (joke.flags.explicit !== false && joke.flags.explicit !== true))
            {
                jokeErrors.push(tr(lang, "parseJokesNoFlagExplicit"));
                validParamsObj.flags.explicit = false;
            }
        }
        else
        {
            jokeErrors.push(tr(lang, "parseJokesNoFlagsObject"));
            validParamsObj.flags = {
                nsfw: false,
                racist: false,
                sexist: false,
                political: false,
                religious: false,
                explicit: false
            };
        }

        //#SECTION lang
        let noLangProp = false;
        if(isEmpty(joke.lang))
            noLangProp = true;

        if(!noLangProp)
        {
            if(!languages.isValidLang(joke.lang, lang))
            {
                jokeErrors.push(tr(lang, "parseJokesLangPropertyInvalid"));
                validParamsObj.lang = false;
            }

            // else language is present and valid, so continue
        }
        else
        {
            jokeErrors.push(tr(lang, "parseJokesNoLangProperty"));
            validParamsObj.lang = false;
        }
    }
    catch(err)
    {
        jokeErrors.push(tr(lang, "parseJokesGeneralError", err.toString()));
    }


    const valid = jokeErrors.length == 0;

    return {
        valid,
        errorStrings: jokeErrors,
        jokeParams: validParamsObj
    };
}

//#MARKER category aliases
/**
 * Returns the resolved value of a joke category alias or returns the initial value if it isn't an alias or is invalid
 * @param {JokeCategory|JokeCategoryAlias} category A singular joke category or joke category alias
 * @returns {JokeCategory}
 */
function resolveCategoryAlias(category)
{
    if(typeof category !== "string")
        return undefined;

    let cat = category;
    categoryAliases.forEach(catAlias => {
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


module.exports = { init, validateSubmission, resolveCategoryAlias, resolveCategoryAliases };
