const { XMLHttpRequest } = require("xmlhttprequest");
// const jsl = require("svjsl");
const semver = require("semver");

const settings = require("../settings");

const meta = {
    name: "Info",
    category: "Endpoints",
};

const baseURL = `http://127.0.0.1:${settings.httpServer.port}`;


/**
 * @typedef {Object} UnitTestResult
 * @prop {Object} meta
 * @prop {String} meta.name
 * @prop {String} meta.category
 * @prop {Array<String>} errors
 */

/**
 * Runs this unit test
 * @returns {Promise<UnitTestResult>}
 */
function run()
{
    return new Promise((resolve, reject) => {
        let errors = [];


        let run = () => new Promise(xhrResolve => {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", `${baseURL}/info`);

            xhr.onreadystatechange = () => {
                if(xhr.readyState == 4)
                {
                    if(xhr.status >= 200 && xhr.status < 300)
                    {
                        let resp = JSON.parse(xhr.responseText);
                        let packageJSON = require("../package.json");

                        //#SECTION error
                        if(resp.error == true)
                        {
                            errors.push(`"error" parameter is set to "true" - error message: ${resp.message}`);
                            return xhrResolve();
                        }

                        //#SECTION version
                        if(!semver.eq(resp.version, packageJSON.version))
                            errors.push(`API version (${resp.version}) doesn't match version in package.json (${packageJSON.version})`);

                        //#SECTION joke count
                        if(!resp.jokes.totalCount || isNaN(parseInt(resp.jokes.totalCount)))
                            errors.push("API supplied no \"totalCount\" param or it is not a number");
                        
                        //#SECTION categories
                        let possibleCats = [settings.jokes.possible.anyCategoryName, ...settings.jokes.possible.categories];
                        if(!arraysEqual(possibleCats, resp.jokes.categories))
                            errors.push(`API's categories (${resp.jokes.categories.map(c => c.substring(0, 5)).join(", ")}) differ from the local ones (${possibleCats.map(c => c.substring(0, 5)).join(", ")})`);

                        //#SECTION flag
                        let possibleFlags = settings.jokes.possible.flags;
                        if(!arraysEqual(possibleFlags, resp.jokes.flags))
                            errors.push(`API's flags (${resp.jokes.flags.join(", ")}) differ from the local ones (${possibleFlags.join(", ")})`);

                        //#SECTION types
                        let possibleTypes = settings.jokes.possible.types;
                        if(!arraysEqual(possibleTypes, resp.jokes.types))
                            errors.push(`API's types (${resp.jokes.types.join(", ")}) differ from the local ones (${possibleTypes.join(", ")})`);

                        //#SECTION formats
                        let possibleFormats = settings.jokes.possible.formats;
                        if(!arraysEqual(possibleFormats, resp.formats))
                            errors.push(`API's formats (${resp.formats.join(", ")}) differ from the local ones (${possibleFormats.join(", ")})`);
                        
                        //#SECTION joke languages
                        if(!resp.jokeLanguages || isNaN(parseInt(resp.jokeLanguages)))
                            errors.push("API supplied no \"jokeLanguages\" param or it is not a number");

                        //#SECTION system languages
                        if(!resp.systemLanguages || isNaN(parseInt(resp.systemLanguages)))
                            errors.push("API supplied no \"systemLanguages\" param or it is not a number");

                        //#SECTION info string
                        if(typeof resp.info != "string")
                            errors.push("API supplied no \"info\" param or it is not a string");

                        //#SECTION timestamp
                        let resTS = parseInt(resp.timestamp);
                        let localTS = parseInt(new Date().getTime());
                        let tsRange = [localTS - 600000, localTS + 600000];
                        if(resTS < tsRange[0] || resTS > tsRange[1])
                            errors.push("API system's time is out of sync by more than 10 minutes");
                        
                        return xhrResolve();
                    }
                    else
                    {
                        errors.push(`Couldn't reach endpoint - HTTP status: ${xhr.status}`);
                        return xhrResolve();
                    }
                }
            };

            xhr.send();
        });

        run().then(() => {
            if(errors.length == 0)
                return resolve({ meta });
            else
                return reject({ meta, errors });
        });
    });
}


/**
 * Checks if two arrays contain the same elements (order is ignored)
 * @author [canbax](https://stackoverflow.com/a/55614659/8602926)
 * @param {Array<*>} a1 
 * @param {Array<*>} a2 
 */
function arraysEqual(a1, a2) {
    const superSet = {};
    for(const i of a1)
    {
        const e = i + typeof i;
        superSet[e] = 1;
    }
  
    for(const i of a2)
    {
        const e = i + typeof i;
        if(!superSet[e])
            return false;
        superSet[e] = 2;
    }
  
    for(let e in superSet)
    {
        if(superSet[e] === 1)
            return false;
    }

    return true;
}

module.exports = { meta, run };
