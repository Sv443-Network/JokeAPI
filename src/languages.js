const fs = require("fs");

const settings = require("../settings");


/**
 * Initializes the language module
 */
function init()
{
    return new Promise((resolve, reject) => {
        fs.readFile(settings.languages.langFilePath, (err, data) => {
            if(err)
                return reject(err);
            else
            {
                let languages = JSON.parse(data.toString());
                process.languages = languages;
                return resolve(languages);
            }
        });
    });
}

/**
 * Checks whether or not a provided language code is ISO 639-1 or ISO 639-2 compatible
 * @param {String} langCode Two-character language code
 * @returns {Boolean|String} Returns `true` if code exists, string with error message if not
 */
function isValidLang(langCode)
{
    if(process.languages == undefined)
        return "INTERNAL_ERROR: Language module was not correctly initialized (yet)";

    if(typeof langCode !== "string" || langCode.length !== 2)
        return "Language code is not a string or not two characters in length";

    let requested = process.languages[langCode];

    if(typeof requested === "string")
        return true;
    else
        return "Language code doesn't exist";
}

module.exports = { init, isValidLang };
