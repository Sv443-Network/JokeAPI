const http = require("http");
const convertFileFormat = require("../src/fileFormatConverter");
const httpServer = require("../src/httpServer");
const parseURL = require("../src/parseURL");
const parseJokes = require("../src/parseJokes");
const FilteredJoke = require("../src/classes/FilteredJoke");
const jsl = require("svjsl");
const settings = require("../settings");

jsl.unused(http);


const meta = {
    "name": "Joke",
    "desc": "Returns a joke from the specified category that is also matching the provided (optional) filters",
    "usages": [
        `GET ${settings.info.docsURL}/joke/{CATEGORY_NAME}[?format&blacklistFlags&idRange&contains&type] | Returns a joke from the specified category that is also matching the provided filters`
    ]
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
    let category = (url[settings.httpServer.urlPathOffset + 1]|| "empty_category").toLowerCase() || "";

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
        else if(typeof category == "object")
        {
            if(category.map(c => c = c.toLowerCase()).includes(cat.toLowerCase()))
                categoryValid = true;
        }
    });

    let fCat = false;
    if(typeof category != "object")
        fCat = filterJoke.setAllowedCategories([category]);
    else fCat = filterJoke.setAllowedCategories(category);

    if(!fCat || !categoryValid)
        return isErrored(res, format, `The specified categor${category.length == undefined || typeof category != "object" || category.length == 1 ? "y is" : "ies are"} invalid - Got: "${category.length == undefined || typeof category != "object" ? category : category.join(", ")}" - Possible categories are: "${[settings.jokes.possible.anyCategoryName, ...settings.jokes.possible.categories].join(", ")}" (case insensitive)`);
    
    if(!jsl.isEmpty(params))
    {
        //#SECTION type
        if(!jsl.isEmpty(params["type"]) && settings.jokes.possible.types.map(t => t = t.toLowerCase()).includes(params["type"].toLowerCase()))
        {
            let fType = filterJoke.setAllowedType(params["type"].toLowerCase());
            if(!fType)
                return isErrored(res, format, `The specified type is invalid - Got: "${params["type"]}" - Possible types are: "${settings.jokes.possible.types}"`);
        }
        
        //#SECTION contains
        if(!jsl.isEmpty(params["contains"]))
        {
            let fCont = filterJoke.setSearchString(params["contains"].toLowerCase());
            if(!fCont)
                return isErrored(res, format, `The specified type is invalid - Got: "${params["type"]}" - Possible types are: "${settings.jokes.possible.types.join(", ")}"`);
        }

        //#SECTION idRange
        // TODO: add support for ID without separator
        if(!jsl.isEmpty(params["idRange"]))
        {
            try
            {
                let splitParams = params["idRange"].split(settings.jokes.splitCharRegex);

                if(splitParams.length < 2)
                    throw new Error("");

                let fIdR = filterJoke.setIdRange(parseInt(splitParams[0]), parseInt(splitParams[1]));
                if(!fIdR)
                    return isErrored(res, format, `The specified ID range is invalid - Got: "${splitParams[0]} to ${splitParams[1]}" - Max ID range is: "0-${(parseJokes.jokeCount - 1)}"`);
            }
            catch(err)
            {
                return isErrored(res, format, `The values in the "idRange" parameter are invalid or are not numbers - ${err}`);
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
                return isErrored(res, format, `The specified flags are invalid - Got: "${flags.join(", ")}" - Possible flags are: "${settings.jokes.possible.flags.join(", ")}"`);
            
            let fFlg = filterJoke.setBlacklistFlags(flags);
            if(!fFlg)
                return isErrored(res, format, `The specified flags are invalid - Got: "${flags.join(", ")}" - Possible flags are: "${settings.jokes.possible.flags.join(", ")}"`);
        }
    }
    

    filterJoke.getJoke().then(joke => {
        let responseText = convertFileFormat.auto(format, joke);
        httpServer.pipeString(res, responseText, parseURL.getMimeTypeFromFileFormatString(format));
    }).catch(err => {
        return isErrored(res, format, `Error while finalizing joke filtering: ${err}`);
    });
};

/**
 * Responds with a preformatted error message
 * @param {http.ServerResponse} res 
 * @param {String} format 
 * @param {String} msg 
 */
const isErrored = (res, format, msg) => {
    //TODO: format all error occurrencies for XML

    let errFromRegistry = require("." + settings.errors.errorRegistryIncludePath)["106"];
    let errorObj = {
        error: true,
        internalError: false,
        code: 106,
        message: errFromRegistry.errorMessage,
        causedBy: errFromRegistry.causedBy,
        additionalInfo: msg
    };

    let responseText = convertFileFormat.auto(format, errorObj);
    httpServer.pipeString(res, responseText, parseURL.getMimeTypeFromFileFormatString(format));
};

module.exports = { meta, call };