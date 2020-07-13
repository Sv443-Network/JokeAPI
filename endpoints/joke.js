const http = require("http");
const convertFileFormat = require("../src/fileFormatConverter");
const httpServer = require("../src/httpServer");
const parseURL = require("../src/parseURL");
const parseJokes = require("../src/parseJokes");
const languages = require("../src/languages");
const tr = require("../src/translate");
const FilteredJoke = require("../src/classes/FilteredJoke");
const jsl = require("svjsl");
const settings = require("../settings");

jsl.unused(http);


const meta = {
    "name": "Joke",
    "desc": "Returns a joke from the specified category / categories that is also matching the provided (optional) filters",
    "usage": {
        "method": "GET",
        "url": `${settings.info.docsURL}/joke/{CATEGORY}`,
        "supportedParams": [
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

/**
 * Calls this endpoint
 * @param {http.IncomingMessage} req The HTTP server request
 * @param {http.ServerResponse} res The HTTP server response
 * @param {Array<String>} url URL path array gotten from the URL parser module
 * @param {Object} params URL query params gotten from the URL parser module
 * @param {String} format The file format to respond with
 */
const call = (req, res, url, params, format) => {
    jsl.unused([req, url]);

    let filterJoke = new FilteredJoke(parseJokes.allJokes);

    //#SECTION category validation
    let category = (url[settings.httpServer.urlPathOffset + 1]|| "(empty)").toLowerCase() || "";

    let includesSplitChar = false;
    settings.jokes.splitChars.forEach(splC => {
        if(!jsl.isEmpty(category) && category.includes(splC))
            includesSplitChar = true;
    });

    if(includesSplitChar)
        category = category.split(settings.jokes.splitCharRegex);
    
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

    //TODO: translate all error messages with tr()

    //#SECTION language
    if(params && !jsl.isEmpty(params["lang"]))
    {
        try
        {
            langCode = params["lang"].toString();

            if(languages.isValidLang(langCode))
                filterJoke.setLanguage(langCode);
            else
                return isErrored(res, format, tr(langCode, "invalidLangCode", langCode), langCode);
        }
        catch(err)
        {
            return isErrored(res, format, tr(langCode, "invalidLangCodeNoArg"), langCode);
        }
    }

    if(!fCat || !categoryValid)
        return isErrored(res, format, `The specified categor${category.length == undefined || typeof category != "object" || category.length == 1 ? "y is" : "ies are"} invalid - Got: "${category.length == undefined || typeof category != "object" ? category : category.join(", ")}" - Possible categories are: "${[settings.jokes.possible.anyCategoryName, ...settings.jokes.possible.categories].join(", ")}" (case insensitive)`, langCode);
    
    let jokeAmount = 1;

    if(!jsl.isEmpty(params))
    {
        //#SECTION type
        if(!jsl.isEmpty(params["type"]) && settings.jokes.possible.types.map(t => t.toLowerCase()).includes(params["type"].toLowerCase()))
        {
            if(!filterJoke.setAllowedType(params["type"].toLowerCase()))
                return isErrored(res, format, `The specified type is invalid - Got: "${params["type"]}" - Possible types are: "${settings.jokes.possible.types}"`, langCode);
        }
        
        //#SECTION contains
        if(!jsl.isEmpty(params["contains"]))
        {
            if(!filterJoke.setSearchString(params["contains"].toLowerCase()))
                return isErrored(res, format, `The specified type is invalid - Got: "${params["type"]}" - Possible types are: "${settings.jokes.possible.types.join(", ")}"`, langCode);
        }

        //#SECTION idRange
        if(!jsl.isEmpty(params["idRange"]))
        {
            try
            {
                if(params["idRange"].match(settings.jokes.splitCharRegex))
                {
                    let splitParams = params["idRange"].split(settings.jokes.splitCharRegex);

                    if(!filterJoke.setIdRange(parseInt(splitParams[0]), parseInt(splitParams[1])))
                        return isErrored(res, format, `The specified ID range is invalid - Got: "${splitParams[0]} to ${splitParams[1]}" - max possible ID range is: "0-${(parseJokes.jokeCount - 1)}"`, langCode);
                }
                else
                {
                    let id = parseInt(params["idRange"]);
                    if(!filterJoke.setIdRange(id, id))
                        return isErrored(res, format, `The specified ID range is invalid - Got: "${params["idRange"]}" - max possible ID range is: "0-${(parseJokes.jokeCount - 1)}"`, langCode);
                }
            }
            catch(err)
            {
                return isErrored(res, format, `The values in the "idRange" parameter are invalid or are not numbers - ${err}`, langCode);
            }
        }

        //#SECTION blacklistFlags
        if(!jsl.isEmpty(params["blacklistFlags"]))
        {
            let flags = params["blacklistFlags"].split(settings.jokes.splitCharRegex) || [];
            let erroredFlags = [];
            flags.forEach(fl => {
                if(!settings.jokes.possible.flags.includes(fl))
                    erroredFlags.push(fl);
            });

            if(erroredFlags.length > 0)
                return isErrored(res, format, `The specified flags are invalid - Got: "${flags.join(", ")}" - Possible flags are: "${settings.jokes.possible.flags.join(", ")}"`, langCode);
            
            let fFlg = filterJoke.setBlacklistFlags(flags);
            if(!fFlg)
                return isErrored(res, format, `The specified flags are invalid - Got: "${flags.join(", ")}" - Possible flags are: "${settings.jokes.possible.flags.join(", ")}"`, langCode);
        }

        //#SECTION amount
        if(!jsl.isEmpty(params["amount"]))
        {
            jokeAmount = parseInt(params["amount"]);

            if(isNaN(jokeAmount) || jokeAmount < 1)
                jokeAmount = 1;

            if(jokeAmount > settings.jokes.maxAmount)
                jokeAmount = settings.jokes.maxAmount;

            let fAmt = filterJoke.setAmount(jokeAmount);
            if(!fAmt)
                return isErrored(res, format, `Internal error while setting joke amount: ${fAmt}`, langCode);
        }
    }
    

    filterJoke.getJokes(filterJoke.getAmount()).then(jokesArray => {
        let responseText = "";

        if(jokeAmount == 1)
        {
            let singleObj = {
                error: false,
                ...jokesArray[0]
            };

            responseText = convertFileFormat.auto(format, singleObj);
        }
        else
        {
            let multiObj = {};

            if(format != "xml")
            {
                multiObj = {
                    error: false,
                    jokes: jokesArray
                };
            }
            else
            {
                multiObj = {
                    error: false,
                    jokes: { "joke": jokesArray }
                };
            }

            responseText = convertFileFormat.auto(format, multiObj);
        }

        httpServer.pipeString(res, responseText, parseURL.getMimeTypeFromFileFormatString(format));
    }).catch(err => {
        return isErrored(res, format, `Error while finalizing joke filtering: ${Array.isArray(err) ? err.join("; ") : err}`, langCode);
    });
};

/**
 * Responds with a preformatted error message
 * @param {http.ServerResponse} res 
 * @param {String} format 
 * @param {String} msg 
 * @param {String} lang 2-char lang code
 * @param {...any} args Arguments to replace numbered %-placeholders with. Only use objects that are strings or convertable to them with `.toString()`!
 */
const isErrored = (res, format, msg, lang, ...args) => {
    let errFromRegistry = require("." + settings.errors.errorMessagesPath)["106"];
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

    let responseText = convertFileFormat.auto(format, errorObj);
    httpServer.pipeString(res, responseText, parseURL.getMimeTypeFromFileFormatString(format));
};

module.exports = { meta, call };
