const jsl = require("svjsl");

const parseJokes = require("../parseJokes");
const languages = require("../languages");

const settings = require("../../settings");


jsl.unused(parseJokes); // only used for typedefs

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

/**
 * @typedef {Object} CountPerLangObj
 * @prop {Number} [en]
 * @prop {Number} [de]
 */

/**
 * @typedef {Object} SafeJokesPerLangObj
 * @prop {String} lang lang code
 * @prop {Number} count amount of safe jokes
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
        let jokeCountPerLang = {};
        this._safeJokes = [];

        //#SECTION check validity, get joke count and get format versions
        Object.keys(jokeArray).forEach(key => {
            if(languages.isValidLang(key) !== true)
                throw new Error(`Error: invalid language code in construction of an AllJokes object. Expected valid two character language code - got "${key}"`);
            
            let currentLangSafeJokesCount = 0;

            if(!jokeCountPerLang[key])
                jokeCountPerLang[key] = 0;

            jokeCount += jokeArray[key].jokes.length;
            jokeCountPerLang[key] += jokeArray[key].jokes.length;

            let fv = jokeArray[key].info.formatVersion;

            // iterates over each joke of the current language
            jokeArray[key].jokes.forEach((j, i) => {
                if(j.safe === true)
                    currentLangSafeJokesCount++;

                jokeArray[key].jokes[i].lang = key;
            });

            if(fv != settings.jokes.jokesFormatVersion)
                throw new Error(`Error: Jokes file with language ${key} has the wrong format version. Expected ${settings.jokes.jokesFormatVersion} but got ${fv}`);

            formatVersions.push(fv);

            this._safeJokes.push({
                lang: key,
                count: currentLangSafeJokesCount
            });
        });

        formatVersions.push(settings.jokes.jokesFormatVersion);

        if(!jsl.allEqual(formatVersions))
            throw new Error(`Error: One or more of the jokes-xy.json files contain(s) a wrong formatVersion parameter`);

        if(typeof jokeArray != "object" || Array.isArray(jokeArray))
            throw new Error(`Error while constructing a new AllJokes object: parameter "jokeArray" is invalid`);

        this.jokes = jokeArray;
        this._jokeCount = jokeCount;
        this._jokeCountPerLang = jokeCountPerLang;
        this._formatVersions = formatVersions;

        return this;
    }

    /**
     * Returns an array of all jokes of the specified language
     * @param {String} [langCode="en"] Two character language code
     * @returns {Array<parseJokes.SingleJoke|parseJokes.TwopartJoke>}
     */
    getJokeArray(langCode)
    {
        if(languages.isValidLang(langCode) !== true)
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
        if(languages.isValidLang(langCode) !== true)
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

    /**
     * Returns an object containing joke counts for every lang code
     * @returns {CountPerLangObj}
     */
    getJokeCountPerLang()
    {
        return this._jokeCountPerLang;
    }

    /**
     * Returns an object containing the count of safe jokes per language
     * @returns {SafeJokesPerLangObj[]}
     */
    getSafeJokes()
    {
        return this._safeJokes;
    }
}

module.exports = AllJokes;
