// this module initializes the blacklist, whitelist and console blacklist

const jsl = require("svjsl");
const fs = require("fs");
const settings = require("../settings");
const debug = require("./verboseLogging");


/**
 * Initializes all lists (blacklist, whitelist and console blacklist)
 * @returns {Promise}
 */
const init = () => {
    return new Promise((resolve, reject) => {
        //#SECTION read list files
        debug("Lists", "Reading blacklist...");
        fs.readFile(settings.lists.blacklistPath, (err1, blacklist) => {
            if(!jsl.isEmpty(err1))
                return reject(err1);

            blacklist = blacklist.toString();
            debug("Lists", "Reading whitelist...");
            fs.readFile(settings.lists.whitelistPath, (err2, whitelist) => {
                if(!jsl.isEmpty(err2))
                    return reject(err2);

                whitelist = whitelist.toString();
                debug("Lists", "Reading console blacklist...");
                fs.readFile(settings.lists.consoleBlacklistPath, (err3, consoleBlacklist) => {
                    if(!jsl.isEmpty(err3))
                        return reject(err3);

                    consoleBlacklist = consoleBlacklist.toString();
                    
                    //#SECTION put lists in the process object
                    try
                    {
                        if(jsl.isEmpty(process.jokeapi))
                            process.jokeapi = {};
                        if(jsl.isEmpty(process.jokeapi.lists))
                            process.jokeapi.lists = {};
                        
                        process.jokeapi.lists = {
                            blacklist: JSON.parse(blacklist),
                            whitelist: JSON.parse(whitelist),
                            consoleBlacklist: JSON.parse(consoleBlacklist)
                        };
                        if(!jsl.isEmpty(process.jokeapi.lists))
                            return resolve(process.jokeapi.lists);
                        return reject(`Unexpected error: process.jokeapi.lists is empty (${typeof process.jokeapi.lists})`);
                    }
                    catch(err)
                    {
                        return reject(err);
                    }
                });
            });
        });
    });
};
module.exports = { init };