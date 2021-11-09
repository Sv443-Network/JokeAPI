const { readFile, writeFile, stat } = require("fs-extra");
const { resolve } = require("path");
const { filesystem, reserialize, unused } = require("svcorelib");

const settings = require("../../settings");
const cacheSettings = settings.jokes.submissions.cache;


/** @typedef {import("../types").Submission} Submission */
/** @typedef {import("./types").Cache} Cache */
/** @typedef {import("./types").CacheEntry} CacheEntry */
/** @typedef {import("./types").EntryStatus} EntryStatus */


const beautifyJson = true;

const cachePath = resolve(cacheSettings.location);


/**
 * Initializes the submission cache
 * @returns {Promise<void, Error>}
 */
function init()
{
    return new Promise(async (res, rej) => {
        try
        {
            const initFile = async () => await writeFile(cachePath, JSON.stringify({}, undefined, beautifyJson ? 4 : undefined));

            if(!(await filesystem.exists(cachePath)))
                await initFile();
            
            try
            {
                const cacheRaw = (await readFile(cachePath)).toString();
                JSON.parse(cacheRaw);
            }
            catch(err)
            {
                unused(err);

                await initFile();
            }

            return res();
        }
        catch(err)
        {
            const rErr = new Error("Couldn't initialize submission cache");
            rErr.stack = `${rErr.message}\n${err.stack}`;
            return rej(rErr);
        }
    });
}

/**
 * Adds an entry to the cache file
 * @param {Submission} sub
 * @param {EntryStatus} [status]
 * @returns {Promise<void, Error>}
 */
function addEntry(sub, status)
{
    return new Promise(async (res, rej) => {
        try
        {
            const statusObj = typeof status === "string" ? { status } : {};

            const cache = await getEntries();

            if(!Array.isArray(cache[sub.lang]))
                cache[sub.lang] = [];

            cache[sub.lang].push({
                added: Date.now(),
                ...statusObj,
                sub,
            });

            await writeFile(cachePath, JSON.stringify(cache, undefined, beautifyJson ? 4 : undefined));

            return res();
        }
        catch(err)
        {
            return rej(err);
        }
    });
}

/**
 * Reads all entries from the cache file
 * @returns {Promise<Cache[], Error>}
 */
function getEntries()
{
    return new Promise(async (res, rej) => {
        try
        {
            const cacheContRaw = (await readFile(cachePath)).toString();
            return res(JSON.parse(cacheContRaw));
        }
        catch(err)
        {
            return rej(err);
        }
    });
}

/**
 * Clears old entries of the cache file
 * @returns {Promise<void, Error>}
 */
function clearOldEntries()
{
    return new Promise(async (res, rej) => {
        try
        {
            const cache = await getEntries();

            for await(const lang of Object.keys(cache))
            {
                const entries = cache[lang];

                // sort newest first
                entries.sort((a, b) => {
                    //    a < b => -1    //    a = b => 0    //    a > b => 1    //
                    return a.added === b.added ? 0 : a.added > b.added ? 1 : -1;
                });

                // check age of entries
                const maxAgeMs = cacheSettings.maxAge * 60 * 60 * 1000;

                // filter out expired entries
                const nonExpired = entries.filter(entry => Date.now() - maxAgeMs < entry.added);

                // check size of file
                const { size } = await stat(cachePath);

                /** @type {CacheEntry[]} */
                let sizeOvr;

                if(size > cacheSettings.maxSize)
                {
                    sizeOvr = reserialize(nonExpired);

                    // #DEBUG for visualizing time:
                    // sizeOvr = sizeOvr.map(e => ({ t: new Date(e.added).toTimeString(), ...e }));

                    const clearAmt = Math.ceil(cacheSettings.clearRatio * sizeOvr.length);

                    // remove the oldest jokes with the ratio defined in the settings
                    sizeOvr.splice(sizeOvr.length - clearAmt, clearAmt);
                }

                const writeCache = sizeOvr ?? nonExpired;

                // write changes to cache file
                await writeFile(cachePath, JSON.stringify(writeCache, undefined, beautifyJson ? 4 : undefined));
            }

            return res();
        }
        catch(err)
        {
            return rej(err);
        }
    });
}

module.exports = { init, addEntry, getEntries, clearOldEntries };
