const jsl = require("svjsl");

const languages = require("../languages");

const settings = require("../../settings");


/**
 * @typedef {Object} SingleJoke A joke of type single
 * @prop {String} category The category of the joke
 * @prop {("single")} type The type of the joke
 * @prop {String} joke The joke itself
 * @prop {Object} flags
 * @prop {Boolean} flags.nsfw Whether the joke is NSFW or not
 * @prop {Boolean} flags.racist Whether the joke is racist or not
 * @prop {Boolean} flags.sexist Whether the joke is sexist or not
 * @prop {Boolean} flags.religious Whether the joke is religiously offensive or not
 * @prop {Boolean} flags.political Whether the joke is politically offensive or not
 * @prop {Number} id The ID of the joke
 */

/**
 * @typedef {Object} TwopartJoke A joke of type twopart
 * @prop {String} category The category of the joke
 * @prop {("twopart")} type The type of the joke
 * @prop {String} setup The setup of the joke
 * @prop {String} delivery The delivery of the joke
 * @prop {Object} flags
 * @prop {Boolean} flags.nsfw Whether the joke is NSFW or not
 * @prop {Boolean} flags.racist Whether the joke is racist or not
 * @prop {Boolean} flags.sexist Whether the joke is sexist or not
 * @prop {Boolean} flags.religious Whether the joke is religiously offensive or not
 * @prop {Boolean} flags.political Whether the joke is politically offensive or not
 * @prop {Number} id The ID of the joke
 */

// expected format:
/*
{
    "en": {
        info: {
            formatVersion: 2
        },
        jokes: [
            {
                (joke)
            },
            ...
        ]
    },
    ...
}
*/

class AllJokes
{
    /**
     * Constructs a new AllJokes object. This object contains all methods to get certain jokes
     * @param {Object} jokeArray 
     */
    constructor(jokeArray)
    {
        this.jokes = {};
        let jokeCount = 0;
        let formatVersions = [];

        //#SECTION check validity, get joke count and get format versions
        Object.keys(jokeArray).forEach(key => {
            if(!languages.isValidLang(key))
                throw new Error(`Error: invalid language code in construction of an AllJokes object. Expected valid two character language code - got "${key}"`);

            jokeCount += jokeArray[key].jokes.length;

            let fv = jokeArray[key].info.formatVersion;

            if(fv != settings.jokes.jokesFormatVersion)
                throw new Error(`Error: Jokes file with language ${key} has the wrong format version. Expected ${settings.jokes.jokesFormatVersion} but got ${fv}`);

            formatVersions.push(fv);
        });

        formatVersions.push(settings.jokes.jokesFormatVersion);

        if(!jsl.allEqual(formatVersions))
            throw new Error(`Error: One or more of the jokes-xy.json files contain(s) a wrong formatVersion parameter`);

        if(typeof jokeArray != "object" || Array.isArray(jokeArray))
            throw new Error(`Error while constructing a new AllJokes object: parameter "jokeArray" is invalid`);

        this.jokes = jokeArray;
        this._jokeCount = jokeCount;
        this._formatVersions = formatVersions;

        return this;
    }

    /**
     * Returns an array of all jokes of the specified language
     * @param {String} [langCode="en"] Two character language code
     * @returns {Array<SingleJoke|TwopartJoke>}
     */
    getJokeArray(langCode)
    {
        if(!languages.isValidLang(langCode))
            langCode = settings.languages.defaultLanguage;

        return (typeof this.jokes[langCode] == "object" ? this.jokes[langCode].jokes : []);
    }

    /**
     * Returns the joke format version
     * @param {String} [langCode="en"] Two character language code
     * @returns {Number|undefined} Returns a number if the format version was set, returns undefined, if not
     */
    getFormatVersion(langCode)
    {
        if(!languages.isValidLang(langCode))
            langCode = settings.languages.defaultLanguage;
        
        if(typeof this.jokes[langCode] != "object")
            return undefined;
        
        return this.jokes[langCode].info ? this.jokes[langCode].info.formatVersion : undefined;
    }

    /**
     * Returns the (human readable / 1-indexed) count of jokes
     * @returns {Number}
     */
    getJokeCount()
    {
        return this._jokeCount;
    }
}

module.exports = AllJokes;
