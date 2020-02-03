// filtered joke gets created out of the total-jokes array
// filters can be applied with setter methods
// final getter method returns one or multiple jokes that match all filters

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

const AllJokes = require("./AllJokes");
const parseJokes = require("../parseJokes");
const jsl = require("svjsl");
const settings = require("../../settings");

jsl.unused([AllJokes]);

class FilteredJoke
{
    //#MARKER constructor
    /**
     * Constructs an object of type FilteredJoke
     * @param {AllJokes} allJokes 
     */
    constructor(allJokes)
    {
        if(jsl.isEmpty(allJokes))
            throw new Error(`Error while constructing new FilteredJoke object: parameter "allJokes" is empty`);

        this._allJokes = allJokes;
        this._filteredJokes = null;

        this._allowedCategories = [
            settings.jokes.possible.anyCategoryName.toLowerCase(),
            ...settings.jokes.possible.categories.map(c => c.toLowerCase())
        ];
        this._allowedTypes = [...settings.jokes.possible.types];
        this._searchString = null;
        this._idRange = [0, (parseJokes.jokeCount - 1)];
        this._flags = [];

        if(!global._lastIDs || !Array.isArray(global._lastIDs))
            global._lastIDs = [];
    }

    //#MARKER categories
    /**
     * Sets the category / categories a joke can be from
     * @param {("Any"|"Programming"|"Miscellaneous"|"Dark"|Array<"Any"|"Programming"|"Miscellaneous"|"Dark">} categories 
     * @returns {Boolean} Returns true if the category / categories were set successfully, else returns false
     */
    setAllowedCategories(categories)
    {
        if(!Array.isArray(categories))
            categories = new Array(categories);

        let allCategories = [
            settings.jokes.possible.anyCategoryName.toLowerCase(),
            ...settings.jokes.possible.categories.map(c => c.toLowerCase())
        ];
        let catsValid = [];

        if(typeof categories == "object" && categories.length != undefined)
            categories.forEach(cat => {
                if(allCategories.includes(cat.toLowerCase()))
                    catsValid.push(true);
            });

        if(catsValid.length != categories.length)
            return false;
        
        if((typeof categories == "string" && categories.toLowerCase() == settings.jokes.possible.anyCategoryName.toLowerCase())
        || (typeof categories != "string" && categories.map(c => c.toLowerCase()).includes(settings.jokes.possible.anyCategoryName.toLowerCase())))
            categories = [...settings.jokes.possible.categories];
        
        this._allowedCategories = categories;
        return true;
    }

    /**
     * Returns the category / categories a joke can be in
     * @returns {Array<"Any"|"Programming"|"Miscellaneous"|"Dark">}
     */
    getAllowedCategories()
    {
        return this._allowedCategories.map(c => c.toLowerCase());
    }

    //#MARKER type
    /**
     * Sets which types the joke(s) can be of
     * @param {"single"|"twopart"} type 
     * @returns {Boolean} Returns true if the type is valid and could be set, false if not
     */
    setAllowedType(type)
    {
        if(settings.jokes.possible.types.includes(type))
        {
            this._allowedTypes = [type];
            return true;
        }
        else return false;
    }

    /**
     * Returns the allowed types a joke can be of
     * @returns {Array<"single"|"twopart">}
     */
    getAllowedTypes()
    {
        return this._allowedTypes
    }

    //#MARKER search string
    /**
     * Sets a string to serach for in jokes
     * @param {String} searchString Raw string to search for in the joke - URI components get decoded automatically
     * @returns {Boolean} Returns true if the search string is a valid string and could be set, false if not
     */
    setSearchString(searchString)
    {
        if(typeof searchString != "string")
            return false;
        
        this._searchString = decodeURIComponent(searchString);
        return true;
    }

    /**
     * Returns the set search string
     * @returns {(String|null)} Returns the search string if it is set, else returns null
     */
    getSearchString()
    {
        return this._searchString;
    }

    //#MARKER id
    /**
     * The IDs a joke can be of
     * @param {Number} start
     * @param {Number} [end] If this is not set, it will default to the same value the param `start` has
     * @returns {Boolean} Returns false if the parameter(s) is/are not of type `number`, else returns true
     */
    setIdRange(start, end = null)
    {
        if(isNaN(start) || isNaN(end) || typeof start != "number" || (!jsl.isEmpty(end) && typeof end != "number") || jsl.isEmpty(start))
            return false;

        if(jsl.isEmpty(end))
            end = start;
        
        this._idRange = [start, end];
        return true;
    }

    /**
     * Returns the current ID range
     * @returns {Array<Number>} An array containing two numbers (index 0 = start ID, index 1 = end ID)
     */
    getIdRange()
    {
        return this._idRange;
    }

    //#MARKER flags
    /**
     * Sets the blacklist flags
     * @param {Array<"nsfw"|"racist"|"sexist"|"religious"|"political">} flags 
     * @returns {Boolean} Returns true if the flags were set, false if they are invalid
     */
    setBlacklistFlags(flags)
    {
        let flagsInvalid = false;
        flags.forEach(flag => {
            if(!settings.jokes.possible.flags.includes(flag))
                flagsInvalid = true;
        });

        if(flagsInvalid)
            return false;
        
        this._flags = flags;
        return true;
    }

    /**
     * Returns the set blacklist flags
     * @returns {Array<"nsfw"|"racist"|"sexist"|"religious"|"political">}
     */
    getBlacklistFlags()
    {
        return this._flags;
    }

    //#MARKER apply filters
    /**
     * Applies the previously set filters and modifies the `this._filteredJokes` property with the applied filters
     * @private
     * @returns {Promise}
     */
    _applyFilters()
    {
        return new Promise((resolve, reject) => {
            try
            {
                this._filteredJokes = [];

                this._allJokes.getJokeArray().forEach(joke => { // iterate over each joke, reading all set filters and thereby checking if it suits the request

                    //#SECTION id range
                    let idRange = this.getIdRange();
                    if(joke.id < idRange[0] || joke.id > idRange[1]) // if the joke is 
                        return;

                    //#SECTION categories
                    let cats = this.getAllowedCategories().map(c => c.toLowerCase());

                    if((typeof cats == "object" && !cats.includes(settings.jokes.possible.anyCategoryName.toLowerCase()))
                    || (typeof cats == "string" && cats != settings.jokes.possible.anyCategoryName.toLowerCase()))
                    {
                        if(!cats.includes(joke.category.toLowerCase())) // if possible categories don't contain the requested category, joke is invalid
                            return;
                    }

                    //#SECTION flags
                    let blFlags = this.getBlacklistFlags();
                    if(!jsl.isEmpty(blFlags))
                    {
                        let flagMatches = false;
                        Object.keys(joke.flags).forEach(flKey => {
                            if(blFlags.includes(flKey) && joke.flags[flKey] === true)
                                flagMatches = true;
                        });
                        if(flagMatches) // joke has one or more of the set blacklist flags, joke is invalid
                            return;
                    }
                    
                    //#SECTION type
                    if(!this.getAllowedTypes().includes(joke.type)) // if joke type doesn't match the requested type(s), joke is invalid
                        return;
                    
                    //#SECTION search string
                    let searchMatches = false;
                    if(!jsl.isEmpty(this.getSearchString()))
                    {
                        if(joke.type == "single"
                        && joke.joke.toLowerCase().includes(this.getSearchString()))
                            searchMatches = true;
                        else if (joke.type == "twopart"
                        && (joke.setup + joke.delivery).toLowerCase().includes(this.getSearchString()))
                            searchMatches = true;
                    }
                    else searchMatches = true;

                    if(!searchMatches) // if the provided search string doesn't match the joke, the joke is invalid
                        return;

                    //#SECTION done
                    this._filteredJokes.push(joke); // joke is valid, push it to the array that gets passed in the resolve()
                });
                resolve(this._filteredJokes);
            }
            catch(err)
            {
                reject(err);
            }
        });
    }

    //#MARKER get joke(s)
    /**
     * Applies all filters and returns the final joke
     * @returns {Promise<SingleJoke|TwopartJoke>} Returns a promise containing a single, randomly selected joke that matches the previously set filters. If the filters didn't match, rejects promise.
     */
    getJoke()
    {
        return new Promise((resolve, reject) => {
            this._applyFilters().then(filteredJokes => {
                if(filteredJokes.length == 0 || typeof filteredJokes != "object")
                    return reject("No jokes were found that match the provided filter(s)");
                
                if(!global._lastIDs || !Array.isArray(global._lastIDs))
                    global._lastIDs = [];
                
                if(typeof global._selectionAttempts != "number")
                    global._selectionAttempts = 0;

                /**
                 * @param {Array<SingleJoke|TwopartJoke>} jokes 
                 */
                let selectRandomJoke = jokes => {
                    let selectedJoke = filteredJokes[jsl.randRange(0, (filteredJokes.length - 1))];

                    if(jokes.length > settings.jokes.lastIDsMaxLength && global._lastIDs.includes(selectedJoke.id))
                    {
                        if(global._selectionAttempts > settings.jokes.jokeRandomizationAttempts)
                            return reject();

                        global._selectionAttempts++;
                        let reducedJokeArray = [];

                        jokes.forEach(j => {
                            if(!global._lastIDs.includes(j.id))
                                reducedJokeArray.push(j);
                        });
                        
                        return selectRandomJoke(reducedJokeArray);
                    }
                    else
                    {
                        global._lastIDs.push(selectedJoke.id);

                        if(global._lastIDs.length > settings.jokes.lastIDsMaxLength)
                            global._lastIDs.shift();

                        global._selectionAttempts = 0;

                        return selectedJoke;
                    }
                };

                let randJoke = selectRandomJoke(filteredJokes);
                return resolve(randJoke);
            }).catch(err => {
                return reject(err);
            });
        });
    }

    /**
     * Applies all filters and returns an array of all jokes that are viable
     * @returns {Promise<Array<SingleJoke|TwopartJoke>>} Returns a promise containing a single, randomly selected joke that matches the previously set filters. If the filters didn't match, rejects promise.
     */
    getAllJokes()
    {
        return new Promise((resolve, reject) => {
            this._applyFilters().then(filteredJokes => {
                resolve(filteredJokes);
            }).catch(err => {
                reject(err);
            });
        });
    }
}

module.exports = FilteredJoke;