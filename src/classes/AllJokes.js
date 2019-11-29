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

/**
 * @typedef {Object} JokeArray
 * @prop {Object} info
 * @prop {Number} info.formatVersion
 * @prop {Array<SingleJoke|TwopartJoke>} jokes
 */

class AllJokes
{
    /**
     * Constructs a new AllJokes object. This object contains all methods to get certain jokes
     * @param {JokeArray} jokeArray 
     */
    constructor(jokeArray)
    {
        if(typeof jokeArray != "object" || Array.isArray(jokeArray) || !Array.isArray(jokeArray.jokes))
            throw new Error(`Error while constructing a new AllJokes object: parameter "jokeArray" is invalid`);

        this.info = jokeArray["info"];
        this.jokes = jokeArray["jokes"];
        this._jokeCount = jokeArray["jokes"].length;
    }

    /**
     * Returns an array of all jokes
     * @returns {Array<SingleJoke|TwopartJoke>}
     */
    getJokeArray()
    {
        return this.jokes;
    }

    /**
     * Returns the joke format version
     * @returns {(Number|undefined)} Returns a number, if the format version was set, returns undefined, if not
     */
    getFormatVersion()
    {
        if(this.info == undefined)
            return undefined;
        return this.info.formatVersion;
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
     * Returns the joke format version
     * @returns {Number}
     */
    getJokeFormatVersion()
    {
        return this.info.formatVersion;
    }
}

module.exports = AllJokes;