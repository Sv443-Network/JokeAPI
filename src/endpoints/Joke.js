const scl = require("svcorelib");

const parseJokes = require("../parseJokes");
const FilteredJoke = require("../classes/FilteredJoke");
const resolveIP = require("../resolveIP");
const Endpoint = require("../classes/Endpoint");
const languages = require("../languages");
const tr = require("../translate");

const settings = require("../../settings");


//#MARKER class def + constructor

/**
 * Returns a joke from the specified category / categories that is also matching the provided filters
 */
class Joke extends Endpoint {
    /**
     * Returns a joke from the specified category / categories that is also matching the provided filters
     */
    constructor()
    {
        /** @type {Endpoint.EndpointMeta} */
        const meta = {
            usage: {
                method: "GET",
                supportedParams: [
                    "safe-mode",
                    "format",
                    "blacklistFlags",
                    "type",
                    "contains",
                    "idRange",
                    "lang",
                    "amount"
                ]
            }
        };

        super("joke", meta);

        this.allJokes = parseJokes.allJokes;
        
        this.positionalArguments = ["Category|CategoryAlias"];
    }

    //#MARKER get joke
    /**
     * This method is run each time a client requests this endpoint
     * @param {http.IncomingMessage} req The HTTP server request
     * @param {http.ServerResponse} res The HTTP server response
     * @param {string[]} url URL path array gotten from the URL parser module
     * @param {object} params URL query params gotten from the URL parser module
     * @param {string} format The file format to respond with
     */
    call(req, res, url, params, format)
    {
        const lang = Endpoint.getLang(params);

        let statusCode = 200;

        const ip = resolveIP(req);
        let filterJoke = new FilteredJoke(parseJokes.allJokes);


        //#SECTION category validation
        let category = (url[settings.httpServer.urlPathOffset + 1]|| "(empty)").toLowerCase() || "";

        let includesSplitChar = false;
        settings.jokes.splitChars.forEach(splC => {
            if(!scl.isEmpty(category) && category.includes(splC))
                includesSplitChar = true;
        });

        if(includesSplitChar)
            category = category.split(settings.jokes.splitCharRegex);

        // resolve category aliases
        if(Array.isArray(category))
            category = parseJokes.resolveCategoryAliases(category);
        else
            category = parseJokes.resolveCategoryAlias(category);

        
        let categoryValid = false;
        [settings.jokes.possible.anyCategoryName, ...settings.jokes.possible.categories].forEach(cat => {
            if(typeof category == "string")
            {
                if(category.toLowerCase() == cat.toLowerCase())
                    categoryValid = true;
            }
            else if(Array.isArray(category))
            {
                if(category.map(c => c.toLowerCase()).includes(cat.toLowerCase()))
                    categoryValid = true;
            }
        });

        let fCat = false;
        if(!Array.isArray(category))
            fCat = filterJoke.setAllowedCategories([category]);
        else fCat = filterJoke.setAllowedCategories(category);

        let langCode = settings.languages.defaultLanguage;

        //#SECTION language
        if(params && !scl.isEmpty(params["lang"]))
        {
            try
            {
                langCode = params["lang"].toString();

                if(languages.isValidLang(langCode) === true)
                    filterJoke.setLanguage(langCode);
                else
                    return this.isErrored(res, format, tr(langCode, "invalidLangCode", langCode), langCode);
            }
            catch(err)
            {
                return this.isErrored(res, format, tr(langCode, "invalidLangCodeNoArg"), langCode);
            }
        }

        //#SECTION safe mode
        if(params && !scl.isEmpty(params["safe-mode"]) && params["safe-mode"] === true)
            filterJoke.setSafeMode(true);

        if(!fCat || !categoryValid)
        {
            let avlCats = [settings.jokes.possible.anyCategoryName, ...settings.jokes.possible.categories].join(", ");
            let catName = category.length == undefined || typeof category != "object" ? category : category.join(", ");

            return this.isErrored(res, format, tr(langCode, "invalidCategory", catName, avlCats), langCode);
        }
        
        let jokeAmount = 1;

        if(!scl.isEmpty(params))
        {
            //#SECTION type
            if(!scl.isEmpty(params["type"]) && settings.jokes.possible.types.map(t => t.toLowerCase()).includes(params["type"].toLowerCase()))
            {
                if(!filterJoke.setAllowedType(params["type"].toLowerCase()))
                    return this.isErrored(res, format, tr(langCode, "invalidType", params["type"], settings.jokes.possible.types.join(", ")), langCode);
            }
            
            //#SECTION contains
            if(!scl.isEmpty(params["contains"]))
            {
                if(!filterJoke.setSearchString(params["contains"].toLowerCase()))
                    return this.isErrored(res, format, tr(langCode, "invalidType", params["type"], settings.jokes.possible.types.join(", ")), langCode);
            }

            //#SECTION idRange
            if(!scl.isEmpty(params["idRange"]))
            {
                try
                {
                    if(params["idRange"].match(settings.jokes.splitCharRegex))
                    {
                        let splitParams = params["idRange"].split(settings.jokes.splitCharRegex);

                        if(!splitParams[0] && splitParams[1])
                            splitParams[0] = splitParams[1];
                        
                        if(!splitParams[1] && splitParams[0])
                            splitParams[1] = splitParams[0];

                        if(!filterJoke.setIdRange(parseInt(splitParams[0]), parseInt(splitParams[1])))
                            return this.isErrored(res, format, tr(langCode, "idRangeInvalid", splitParams[0], splitParams[1], (parseJokes.jokeCountPerLang[langCode] - 1)), langCode);
                    }
                    else
                    {
                        let id = parseInt(params["idRange"]);
                        if(!filterJoke.setIdRange(id, id, langCode))
                            return this.isErrored(res, format, tr(langCode, "idRangeInvalidSingle", params["idRange"], (parseJokes.jokeCountPerLang[langCode] - 1)), langCode);
                    }
                }
                catch(err)
                {
                    return this.isErrored(res, format, tr(langCode, "idRangeInvalidGeneric", err), langCode);
                }
            }

            //#SECTION blacklistFlags
            if(!scl.isEmpty(params["blacklistFlags"]))
            {
                let flags = params["blacklistFlags"].split(settings.jokes.splitCharRegex) || [];
                let erroredFlags = [];
                flags.forEach(fl => {
                    if(!settings.jokes.possible.flags.includes(fl))
                        erroredFlags.push(fl);
                });

                if(erroredFlags.length > 0)
                    return this.isErrored(res, format, tr(langCode, "invalidFlags", flags.join(", "), settings.jokes.possible.flags.join(", ")), langCode);
                    tr(langCode, "invalidFlags", flags.join(", "), settings.jokes.possible.flags.join(", "))
                
                let fFlg = filterJoke.setBlacklistFlags(flags);
                if(!fFlg)
                    return this.isErrored(res, format, tr(langCode, "invalidFlags", flags.join(", "), settings.jokes.possible.flags.join(", ")), langCode);
            }

            //#SECTION amount
            if(!scl.isEmpty(params["amount"]))
            {
                jokeAmount = parseInt(params["amount"]);

                if(isNaN(jokeAmount) || jokeAmount < 1)
                    jokeAmount = 1;

                if(jokeAmount > settings.jokes.maxAmount)
                    jokeAmount = settings.jokes.maxAmount;

                let fAmt = filterJoke.setAmount(jokeAmount);
                if(!fAmt)
                    return this.isErrored(res, format, tr(langCode, "amountInternalError", fAmt), langCode);
            }
        }
        

        //#SECTION get jokes
        filterJoke.getJokes(ip, langCode, filterJoke.getAmount()).then(jokesArray => {
            let responseObj = {};

            if(jokeAmount == 1)
            {
                responseObj =  {
                    error: false,
                    ...jokesArray[0]
                };
            }
            else
            {
                if(format != "xml")
                {
                    responseObj = {
                        error: false,
                        amount: (jokesArray.length || 1),
                        jokes: jokesArray
                    };
                }
                else
                {
                    responseObj = {
                        error: false,
                        amount: (jokesArray.length || 1),
                        jokes: { "joke": jokesArray }
                    };
                }
            }

            if(jokeAmount > settings.jokes.encodeAmount)
                return Endpoint.tryRespondEncoded(req, res, format, lang, responseObj, statusCode);
            else
                return Endpoint.respond(res, format, lang, responseObj, statusCode);
        }).catch(err => {
            return this.isErrored(res, format, tr(langCode, "errorWhileFinalizing", Array.isArray(err) ? err.join("; ") : err), langCode);
        });
    }

    //#MARKER isErrored
    /**
     * Responds with a preformatted error message
     * @param {http.ServerResponse} res 
     * @param {string} format 
     * @param {string} msg 
     * @param {string} lang 2-char lang code
     * @param {...any} args Arguments to replace numbered %-placeholders with. Only use objects that are strings or convertable to them with `.toString()`!
     */
    isErrored(res, format, msg, lang, ...args)
    {
        let errFromRegistry = require(`../.${settings.errors.errorMessagesPath}`)["106"];
        let errorObj = {};

        let insArgs = (texts, insertions) => {
            if(!Array.isArray(insertions) || insertions.length <= 0)
                return texts;

            insertions.forEach((ins, i) => {

                if(Array.isArray(texts))
                    texts = texts.map(tx => tx.replace(`%${i + 1}`, ins));
                else if(typeof texts == "string")
                    texts = texts.replace(`%${i + 1}`, ins);
            });

            return texts;
        };

        if(format != "xml")
        {
            errorObj = {
                error: true,
                internalError: false,
                code: 106,
                message: insArgs(errFromRegistry.errorMessage[lang], args) || insArgs(errFromRegistry.errorMessage[settings.languages.defaultLanguage], args),
                causedBy: insArgs(errFromRegistry.causedBy[lang], args) || insArgs(errFromRegistry.causedBy[settings.languages.defaultLanguage], args),
                additionalInfo: msg,
                timestamp: new Date().getTime()
            };
        }
        else if(format == "xml")
        {
            errorObj = {
                error: true,
                internalError: false,
                code: 106,
                message: insArgs(errFromRegistry.errorMessage[lang], args) || insArgs(errFromRegistry.errorMessage[settings.languages.defaultLanguage], args),
                causedBy: {"cause": insArgs(errFromRegistry.causedBy[lang], args) || insArgs(errFromRegistry.causedBy[settings.languages.defaultLanguage], args)},
                additionalInfo: msg,
                timestamp: new Date().getTime()
            };
        }

        return Endpoint.respond(res, format, lang, errorObj, 400);
    }
}

module.exports = Joke;
