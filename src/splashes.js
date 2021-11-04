const fs = require("fs-extra");
const { randomItem } = require("svcorelib");

const settings = require("../settings");


/** @typedef {import("./types/splashes").SplashesFile} SplashesFile */


/** @type {SplashesFile} */
let splashes = {};

let splashDefaultLang = "en";


/**
 * Initializes the splash module
 * @returns {Promise<void, string>}
 */
function init()
{
    return new Promise((res, rej) => {
        fs.readFile(settings.languages.splashesFilePath, (err, data) => {
            if(err)
                return rej(`Couldn't read splashes file '${settings.languages.splashesFilePath}' due to error: ${err}`);

            try
            {
                const splashesFile = JSON.parse(data.toString());

                splashDefaultLang = splashesFile.defaultLang;
                // const languages = splashesFile.languages;
                const splashObjs = splashesFile.splashes;

                /** @type {SplashesFile} */
                const allSplashes = {};

                splashObjs.forEach(splashObj => {
                    Object.keys(splashObj).forEach(/**@type {"en"}*/langCode => {
                        if(!Array.isArray(allSplashes[langCode]))
                            allSplashes[langCode] = [];

                        const splashText = splashObj[langCode];
                        
                        allSplashes[langCode].push(splashText);
                    });
                });

                if(Object.keys(allSplashes).length > 0)
                {
                    splashes = allSplashes;
                    return res();
                }
                else
                    return rej(`No splashes present in file '${settings.languages.splashesFilePath}'`);
            }
            catch(err)
            {
                return rej(`General error while loading splash texts: ${err}`);
            }
        });
    });
}

/**
 * Returns a random splash of the specified language
 * @param {string} lang
 */
function getSplash(lang)
{
    let splash = "missingno"; // lgtm[js/useless-assignment-to-local]
    const langSplashes = splashes[lang];

    if(langSplashes && langSplashes.length > 0)
        splash = randomItem(langSplashes);
    else
        splash = randomItem(splashes[splashDefaultLang]);

    return splash;
}

/**
 * Returns all splashes or an empty array if there are none (yet)
 * @returns {SplashesFile}
 */
function getAllSplashes()
{
    return splashes;
}

module.exports = { init, getSplash, getAllSplashes };
