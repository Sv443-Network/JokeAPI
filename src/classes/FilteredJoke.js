// filtered joke gets created out of the total-jokes array
// filters can be applied with setter methods
// final getter method returns one or multiple jokes that match all filters

const AllJokes = require("./AllJokes");
const parseJokes = require("../parseJokes");
const languages = require("../languages");
const tr = require("../translate");
const jsl = require("svjsl");
const settings = require("../../settings");


/** @typedef {"nsfw"|"racist"|"sexist"|"religious"|"political"|"explicit"} BlacklistFlags */


jsl.unused(AllJokes);

var _lastIDs = [];
var _selectionAttempts = 0;

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

        let idRangePerLang = {};

        Object.keys(parseJokes.jokeCountPerLang).forEach(lc => {
            idRangePerLang[lc] = [ 0, (parseJokes.jokeCountPerLang[lc] - 1) ];
        });

        this._allowedCategories = [
            settings.jokes.possible.anyCategoryName.toLowerCase(),
            ...settings.jokes.possible.categories.map(c => c.toLowerCase())
        ];
        this._allowedTypes = [...settings.jokes.possible.types];
        this._searchString = null;
        this._idRange = [0, (parseJokes.jokeCountPerLang[settings.languages.defaultLanguage] - 1)];
        this._idRangePerLang = idRangePerLang;
        this._flags = [];
        this._errors = [];
        this._lang = settings.languages.defaultLanguage;
        this._amount = 1;

        if(!_lastIDs || !Array.isArray(_lastIDs))
            _lastIDs = [];

        return this;
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
        {
            this._errors.push("The joke category is invalid");
            return false;
        }
        
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
        else
        {
            this._errors.push("The \"type\" parameter is invalid");
            return false;
        }
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
        {
            this._errors.push("The \"contains\" parameter is invalid");
            return false;
        }
        
        try
        {
            this._searchString = decodeURIComponent(searchString);
            return true;
        }
        catch(err)
        {
            this._errors.push("The URI is malformatted or the \"contains\" parameter isn't correctly percent-encoded");
            return false;
        }
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
     * @param {String} [lang] Lang code
     * @returns {Boolean} Returns false if the parameter(s) is/are not of type `number`, else returns true
     */
    setIdRange(start, end = null, lang = null)
    {
        if(jsl.isEmpty(end))
            end = start;
        
        if(jsl.isEmpty(lang))
            lang = this.getLanguage() || settings.languages.defaultLanguage;

        if(isNaN(parseInt(start)) || isNaN(parseInt(end)) || typeof start != "number" || typeof end != "number" || jsl.isEmpty(start) || jsl.isEmpty(end))
        {
            this._errors.push("The \"idRange\" parameter values are not numbers");
            return false;
        }

        if(start < 0 || end > this._idRangePerLang[lang][1])
        {
            this._errors.push("The \"idRange\" parameter values are out of range");
            return false;
        }
        
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
     * @param {Array<BlacklistFlags>} flags 
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
        {
            this._errors.push("The \"blacklistFlags\" parameter is invalid or contains one or more invalid flags");
            return false;
        }
        
        this._flags = flags;
        return true;
    }

    /**
     * Returns the set blacklist flags
     * @returns {Array<BlacklistFlags>}
     */
    getBlacklistFlags()
    {
        return this._flags;
    }

    //#MARKER language
    /**
     * Sets the language
     * @param {String} code 
     * @returns {Boolean} Returns true if the language was set, false if it is invalid
     */
    setLanguage(code)
    {
        if(languages.isValidLang(code) === true)
        {
            this._lang = code;
            return true;
        }

        return false;
    }

    /**
     * Returns the set language code
     * @returns {String}
     */
    getLanguage()
    {
        return this._lang || settings.languages.defaultLanguage;
    }

    //#MARKER amount
    /**
     * Sets the amount of jokes
     * @param {Number} num 
     * @returns {Boolean|String} Returns true if the amount was set, string containing error if it is invalid
     */
    setAmount(num)
    {
        num = parseInt(num);

        if(isNaN(num) || num < 1 || num > settings.jokes.maxAmount)
            return `"num" parameter in FilteredJoke.setAmount() couldn't be resolved to an integer or it is less than 0 or greater than ${settings.jokes.maxAmount}`;

        this._amount = num;
        return true;
    }

    /**
     * Returns the set joke amount or `1` if not yet set
     * @returns {Number}
     */
    getAmount()
    {
        return this._amount || 1;
    }

    //#MARKER apply filters
    /**
     * Applies the previously set filters and modifies the `this._filteredJokes` property with the applied filters
     * @private
     * @param {String} lang
     * @returns {Promise}
     */
    _applyFilters(lang)
    {
        return new Promise((resolve, reject) => {
            try
            {
                this._filteredJokes = [];

                if(!lang)
                    lang = settings.languages.defaultLanguage;

                this._allJokes.getJokeArray(lang).forEach(joke => {
                    // iterate over each joke, reading all set filters and thereby checking if it suits the request
                    // to deny a joke from being served, just return from this callback function

                    //#SECTION id range
                    let idRange = this.getIdRange(lang);
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
                        if(joke.type == "single" && joke.joke.toLowerCase().includes(this.getSearchString()))
                            searchMatches = true;
                        else if (joke.type == "twopart" && (joke.setup + joke.delivery).toLowerCase().includes(this.getSearchString()))
                            searchMatches = true;
                    }
                    else searchMatches = true;

                    if(!searchMatches) // if the provided search string doesn't match the joke, the joke is invalid
                        return;
                    
                    //#SECTION language
                    let langCode = this.getLanguage();
                    if(!languages.isValidLang(langCode))
                        return; // invalid lang code
                    if(joke.lang.toLowerCase() != langCode.toLowerCase())
                        return; // lang code doesn't match
                    
                    // amount param is used in getJokes()

                    //#SECTION done
                    this._filteredJokes.push(joke); // joke is valid, push it to the array that gets passed in the resolve()
                });

                return resolve(this._filteredJokes);
            }
            catch(err)
            {
                return reject(err);
            }
        });
    }

    //#MARKER get joke
    /**
     * Applies all filters and returns the final joke
     * @param {Number} [amount=1] The amount of jokes to return
     * @returns {Promise<Array<parseJokes.SingleJoke|parseJokes.TwopartJoke>>} Returns a promise containing an array, which in turn contains a single or multiple randomly selected joke/s that match/es the previously set filters. If the filters didn't match, rejects promise.
     */
    getJokes(amount = 1)
    {
        amount = parseInt(amount);
        if(isNaN(amount) || jsl.isEmpty(amount))
            amount = 1;
        
        return new Promise((resolve, reject) => {
            let retJokes = [];
            let multiSelectLastIDs = [];

            this._applyFilters(this._lang || settings.languages.defaultLanguage).then(filteredJokes => {
                if(filteredJokes.length == 0 || typeof filteredJokes != "object")
                {
                    if(this._errors && this._errors.length > 0)
                        return reject(this._errors);
                    else
                        return reject(tr(this.getLanguage(), "foundNoMatchingJokes"));
                }
                
                if(!_lastIDs || !Array.isArray(_lastIDs))
                    _lastIDs = [];
                
                if(typeof _selectionAttempts != "number")
                    _selectionAttempts = 0;

                /**
                 * @param {Array<parseJokes.SingleJoke|parseJokes.TwopartJoke>} jokes 
                 */
                let selectRandomJoke = jokes => {
                    let idx = jsl.randRange(0, (jokes.length - 1));
                    let selectedJoke = jokes[idx];

                    if(jokes.length > settings.jokes.lastIDsMaxLength && _lastIDs.includes(selectedJoke.id))
                    {
                        if(_selectionAttempts > settings.jokes.jokeRandomizationAttempts)
                            return reject();

                        _selectionAttempts++;

                        jokes.splice(idx, 1); // remove joke that is already contained in _lastIDs

                        return selectRandomJoke(jokes);
                    }
                    else
                    {
                        _lastIDs.push(selectedJoke.id);

                        if(_lastIDs.length > settings.jokes.lastIDsMaxLength)
                            _lastIDs.shift();

                        _selectionAttempts = 0;

                        if(!multiSelectLastIDs.includes(selectedJoke.id))
                        {
                            multiSelectLastIDs.push(selectedJoke.id);
                            return selectedJoke;
                        }
                        else
                        {
                            if(_selectionAttempts > settings.jokes.jokeRandomizationAttempts)
                                return reject();

                            _selectionAttempts++;

                            jokes.splice(idx, 1); // remove joke that is already contained in _lastIDs

                            return selectRandomJoke(jokes);
                        }
                    }
                };

                if(amount < filteredJokes.length)
                {
                    for(let i = 0; i < amount; i++)
                    {
                        let rJoke = selectRandomJoke(filteredJokes);
                        if(rJoke != null)
                            retJokes.push(rJoke);
                    }
                }
                else retJokes = filteredJokes;
                
                // Sort jokes by ID
                // retJokes.sort((a, b) => {
                //     if(b.id > a.id)
                //         return -1;
                //     else
                //         return 1;
                // });

                return resolve(retJokes);
            }).catch(err => {
                return reject(err);
            });
        });
    }

    //#MARKER get all jokes
    /**
     * Applies all filters and returns an array of all jokes that are viable
     * @returns {Promise<Array<parseJokes.SingleJoke|parseJokes.TwopartJoke>>} Returns a promise containing a single, randomly selected joke that matches the previously set filters. If the filters didn't match, rejects promise.
     */
    getAllJokes()
    {
        return new Promise((resolve, reject) => {
            this._applyFilters(this._lang || settings.languages.defaultLanguage).then(filteredJokes => {
                return resolve(filteredJokes);
            }).catch(err => {
                return reject(err);
            });
        });
    }
}

module.exports = FilteredJoke;
