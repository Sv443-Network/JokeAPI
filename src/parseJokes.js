// this module parses all the jokes to verify that they are valid and that their structure is not messed up

const fs = require("fs");
const jsl = require("svjsl");

const settings = require("../settings");

/**
 * Parses all jokes
 * @returns {Promise<Boolean>}
 */
const init = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(settings.jokes.jokesFilePath, (err, jokes) => {
            if(err)
                return reject(err);
            
            let result = [];

            jokes.forEach(joke => {
                if(!jsl.isEmpty(joke.id) && !isNaN(parseInt(joke.id)))
                    result.push(true);
                else result.push(false);

                //#MARKER type and actual joke
                if(joke.type == "single")
                {
                    if(!jsl.isEmpty(joke.id))
                        result.push(true);
                    else result.push(false);
                }
                else if(joke.type == "twopart")
                {
                    if(!jsl.isEmpty(joke.setup))
                        result.push(true);
                    else result.push(false);

                    if(!jsl.isEmpty(joke.delivery))
                        result.push(true);
                    else result.push(false);
                }
                else result.push(false);

                //#MARKER flags
                if(!jsl.isEmpty(joke.flags.nsfw) && (joke.flags.nsfw === false || joke.flags.nsfw === true))
                    result.push(true);
                else result.push(false);

                if(!jsl.isEmpty(joke.flags.political) && (joke.flags.political === false || joke.flags.political === true))
                    result.push(true);
                else result.push(false);

                if(!jsl.isEmpty(joke.flags.religious) && (joke.flags.religious === false || joke.flags.religious === true))
                    result.push(true);
                else result.push(false);
            });

            resolve();
        });
    });
}

module.exports = { init }