// this module parses all the jokes to verify that they are valid and that their structure is not messed up

const fs = require("fs");
const jsl = require("svjsl");

const settings = require("../settings");
const debug = require("./verboseLogging");

/**
 * Parses all jokes
 * @returns {Promise<Boolean>}
 */
const init = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(settings.jokes.jokesFilePath, (err, jokesFile) => {
            if(err)
                return reject(err);
            
            let result = [];

            try
            {
                jokesFile = JSON.parse(jokesFile.toString());
            }
            catch(err)
            {
                reject(`Error while parsing file "${settings.jokes.jokesFilePath}" as JSON: ${err}`);
            }
            

            jokesFile.jokes.forEach((joke, i) => {
                //#MARKER joke ID
                if(!jsl.isEmpty(joke.id) && !isNaN(parseInt(joke.id)))
                    result.push(true);
                else result.push(`Joke with index/ID ${i} doesn't have an "id" property`);

                //#MARKER type and actual joke
                if(joke.type == "single")
                {
                    if(!jsl.isEmpty(joke.joke))
                        result.push(true);
                    else result.push(`Joke with index/ID ${i} doesn't have a "joke" property`);
                }
                else if(joke.type == "twopart")
                {
                    if(!jsl.isEmpty(joke.setup))
                        result.push(true);
                    else result.push(`Joke with index/ID ${i} doesn't have a "setup" property`);

                    if(!jsl.isEmpty(joke.delivery))
                        result.push(true);
                    else result.push(`Joke with index/ID ${i} doesn't have a "delivery" property`);
                }
                else result.push(`Joke with index/ID ${i} doesn't have a "type" property or it is invalid`);

                //#MARKER flags
                if(!jsl.isEmpty(joke.flags))
                {
                    if(!jsl.isEmpty(joke.flags.nsfw) && (joke.flags.nsfw === false || joke.flags.nsfw === true))
                        result.push(true);
                    else result.push(`Joke with index/ID ${i} has an invalid "NSFW" flag`);

                    if(!jsl.isEmpty(joke.flags.political) && (joke.flags.political === false || joke.flags.political === true))
                        result.push(true);
                    else result.push(`Joke with index/ID ${i} has an invalid "political" flag`);

                    if(!jsl.isEmpty(joke.flags.religious) && (joke.flags.religious === false || joke.flags.religious === true))
                        result.push(true);
                    else result.push(`Joke with index/ID ${i} has an invalid "religious" flag`);
                }
                else result.push(`Joke with index/ID ${i} doesn't have a "flags" object or it is invalid`);
            });

            let errors = [];

            result.forEach(res => {
                if(typeof res === "string")
                    errors.push(res);
            });

            debug("JokeParser", `Done parsing jokes. Errors: ${errors.length === 0 ? jsl.colors.fg.green : jsl.colors.fg.red}${errors.length}${jsl.colors.rst}`);

            if(jsl.allEqual(result) && result[0] === true && errors.length === 0)
                return resolve();
            
            return reject(`Errors:\n- ${errors.join("\n- ")}`);
        });
    });
}

module.exports = { init }