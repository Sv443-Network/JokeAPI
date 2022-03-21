// this module initializes the blacklist, whitelist and console blacklist

const { isEmpty, colors } = require("svcorelib");
const fs = require("fs-extra");
const settings = require("../settings");
const debug = require("./debug");
const logger = require("./logger");
const resolveIP = require("./resolveIP");


/** @typedef {import("./types/lists").ListsObj} ListsObj */

/** @type {ListsObj} All lists and their values. Set to `undefined` until `init()` finishes. */
let lists = undefined;

/**
 * Initializes all lists (blacklist, whitelist and console blacklist)
 * @returns {Promise}
 */
function init()
{
    return new Promise((resolve, reject) => {
        //#SECTION read list files
        debug("Lists", "Reading blacklist...");
        fs.readFile(settings.lists.blacklistPath, (err1, blacklist) => {
            if(!isEmpty(err1) && !err1.toString().includes("ENOENT"))
                return reject(err1);
            else if(!isEmpty(err1) && err1.toString().includes("ENOENT"))
            {
                fs.writeFileSync(settings.lists.blacklistPath, "[\n\t\n]");
                debug("Lists", `${colors.fg.red}No blacklist file found! Created empty list.${colors.rst}`);
                blacklist = "[\n\t\n]";
            }

            blacklist = blacklist.toString();

            debug("Lists", "Reading whitelist...");

            fs.readFile(settings.lists.whitelistPath, (err2, whitelist) => {
                if(!isEmpty(err2) && !err2.toString().includes("ENOENT"))
                    return reject(err2);
                else if(!isEmpty(err2) && err2.toString().includes("ENOENT"))
                {
                    debug("Lists", `${colors.fg.red}No whitelist file found! Defaulting to empty list.${colors.rst}`);
                    whitelist = "[\n\t\n]";
                }

                whitelist = whitelist.toString();

                debug("Lists", "Reading console blacklist...");

                fs.readFile(settings.lists.consoleBlacklistPath, (err3, consoleBlacklist) => {
                    if(!isEmpty(err3) && !err3.toString().includes("ENOENT"))
                        return reject(err3);
                    else if(!isEmpty(err3) && err3.toString().includes("ENOENT"))
                        consoleBlacklist = "[\n\t\n]";

                    consoleBlacklist = consoleBlacklist.toString();

                    try
                    {
                        lists = {
                            blacklist: JSON.parse(blacklist),
                            whitelist: JSON.parse(whitelist),
                            consoleBlacklist: JSON.parse(consoleBlacklist),
                        };

                        debug("Lists", "Finished initializing all lists", "green");
                        module.exports.lists = lists;

                        return resolve(lists);
                    }
                    catch(err)
                    {
                        return reject(`Error while initializing lists: ${err}`);
                    }
                });
            });
        });
    });
}

/**
 * Checks whether a provided IP address is in the blacklist
 * @param {string} ip
 * @returns {bool} true if blacklisted, false if not
 */
function isBlacklisted(ip)
{
    if(isEmpty(lists) || !(lists.blacklist instanceof Array))
    {
        logger("fatal", "Blacklist was not initialized when calling lists.isBlacklisted()", true);
        throw new Error("Blacklist was not initialized");
    }

    if(isEmpty(lists.blacklist) || lists.blacklist.length == 0)
        return false;
    
    let returnVal = false;

    lists.blacklist.forEach(blIP => {
        if(!returnVal && (ip == blIP || ip == resolveIP.hashIP(blIP)))
            returnVal = true;
    });

    if(returnVal === true)
        debug("Lists", "Is blacklisted.");

    return returnVal;
}

/**
 * Checks whether a provided IP address is in the whitelist
 * @param {string} ip
 * @returns {bool} Returns true if whitelisted, false if not
 * @throws Throws an error if the lists module was not previously initialized
 */
function isWhitelisted(ip)
{
    let whitelisted = false;

    if(isEmpty(lists) || !(lists.whitelist instanceof Array))
    {
        logger("fatal", "Whitelist was not initialized when calling lists.isWhitelisted()", true);
        throw new Error("Whitelist was not initialized");
    }

    if(isEmpty(lists.whitelist) || lists.whitelist.length == 0)
        return false;

    lists.whitelist.forEach(wlIP => {
        if(!whitelisted && (ip == wlIP || ip == resolveIP.hashIP(wlIP)))
            whitelisted = true;
    });

    return whitelisted;
}

/**
 * Checks whether a provided IP address is in the console blacklist
 * @param {string} ip
 * @returns {bool} true if console blacklisted, false if not
 */
function isConsoleBlacklisted(ip)
{
    if(isEmpty(lists) || !(lists.consoleBlacklist instanceof Array))
    {
        logger("fatal", "Console blacklist was not initialized when calling lists.isConsoleBlacklisted()", true);
        throw new Error("Console blacklist was not initialized");
    }

    if(isEmpty(lists.consoleBlacklist) || lists.consoleBlacklist.length == 0)
        return false;
    
    let returnVal = false;

    lists.consoleBlacklist.forEach(cblIP => {
        if(!returnVal && (ip == cblIP || ip == resolveIP.hashIP(cblIP)))
            returnVal = true;
    });

    return returnVal;
}

module.exports = { init, isBlacklisted, isWhitelisted, isConsoleBlacklisted, lists };
