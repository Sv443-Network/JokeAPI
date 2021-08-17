const mysql = require("mysql");

const { isValidLang } = require("../languages");
const { sendQuery } = require("../sql");
const debug = require("../debug");

const settings = require("../../settings");



/**
 * @typedef {object} CacheEntry An object representing an entry of the joke cache
 * @prop {string} clientIpHash 64-character IP hash of the client
 * @prop {number} jokeID ID of the joke to cache
 * @prop {string} langCode Language code of the joke to cache
 */

/**
 * This class is in direct contact to the SQL DB.  
 * It can add to or read from the joke cache in the database table.  
 * It also handles garbage collection (deleting outdated entries)  
 * This class also handles garbage collection (clearing expired entries).
 * @since 2.4.0
 */
class JokeCache
{
    /**
     * Creates a new joke cache.
     * @param {mysql.Connection} dbConnection
     * @param {string|undefined} [tableName] If not provided, defaults to `settings.jokeCaching.tableName`
     */
    constructor(dbConnection, tableName)
    {
        this.db = dbConnection;
        this.table = typeof tableName == "string" ? tableName : settings.jokeCaching.tableName;
    }

    /**
     * Adds an entry to the provided client's joke cache.
     * @param {string} clientIpHash 64-character IP hash of the client
     * @param {number} jokeID ID of the joke to cache
     * @param {string} langCode Language code of the joke to cache
     * @returns {Promise<object, string>}
     */
    addEntry(clientIpHash, jokeID, langCode)
    {
        debug("JokeCache", `Adding 1 entry to the joke cache - client: '${clientIpHash.substr(0, 16)}…'`);

        return new Promise((pRes, pRej) => {
            if(!JokeCache.isValidClientIpHash(clientIpHash))
                throw new TypeError(`Parameter "clientIpHash" is not a string or not a valid IP hash`);
            
            if(typeof jokeID != "number")
                jokeID = parseInt(jokeID);
            
            if(jokeID < 0)
                throw new TypeError(`Parameter "jokeID" is less than 0 (there are no negative joke IDs you dummy dum dum)`);
            
            if(!isValidLang(langCode))
                throw new TypeError(`Parameter "langCode" is not a valid language code`);

            const insValues = [
                this.table,
                clientIpHash,
                jokeID,
                langCode
            ];

            sendQuery(this.db, `INSERT INTO ?? (ClientIpHash, JokeID, LangCode) VALUES (?, ?, ?);`, ...insValues)
                .then(res => {
                    return pRes(res);
                }).catch(err => {
                    return pRej(err);
                });
        });
    }

    /**
     * Adds multiple entries to the provided clients' joke caches.
     * @param {CacheEntry[]} cacheEntries An array of joke cache entries
     * @returns {Promise<object, string>}
     */
    addEntries(cacheEntries)
    {
        debug("JokeCache", `Adding ${cacheEntries.length} entries to the joke cache`);

        return new Promise((res, rej) => {
            const entries = cacheEntries.map(e => {
                if(!JokeCache.isValidClientIpHash(e.clientIpHash))
                    throw new TypeError(`Parameter "clientIpHash" is not a string or not a valid IP hash`);
                
                if(typeof jokeID != "number")
                    e.jokeID = parseInt(e.jokeID);
                
                if(e.jokeID < 0)
                    throw new TypeError(`Parameter "jokeID" is less than 0 (there are no negative joke IDs you dummy dum dum)`);
                
                if(!isValidLang(e.langCode))
                    throw new TypeError(`Parameter "langCode" is not a valid language code`);

                return [ e.clientIpHash, e.jokeID, e.langCode ];
            });

            let sqlValues = "";

            entries.forEach((entry, idx) => {
                let valPart = "(?, ?, ?)";

                if(idx != entries.length - 1)
                    valPart += ", ";

                sqlValues += mysql.format(valPart, entry);
            });

            sendQuery(this.db, `INSERT INTO ?? (ClientIpHash, JokeID, LangCode) VALUES ${sqlValues};`, settings.jokeCaching.tableName)
                .then(result => {
                    return res(result);
                }).catch(err => {
                    return rej(`Err: ${err}`);
                });
        });
    }

    /**
     * Clears all joke cache entries of the specified client
     * @param {string} clientIpHash 64-character IP hash of the client
     * @throws Throws a TypeError if the client IP hash is invalid
     * @returns {Promise} Resolves with the amount of deleted entries (0 if none were found) - rejects with an instance of `Error` (see also https://www.npmjs.com/package/mysql#error-handling )
     */
    clearEntries(clientIpHash)
    {
        return new Promise((pRes, pRej) => {
            if(!JokeCache.isValidClientIpHash(clientIpHash))
                throw new TypeError(`Provided client IP hash is invalid.`);


            const insValues = [
                this.table,
                clientIpHash
            ];

            sendQuery(this.db, "DELETE FROM ?? WHERE ClientIpHash LIKE ?", ...insValues)
                .then(res => {
                    return pRes((res && typeof res.affectedRows === "number") ? res.affectedRows : 0);
                }).catch(err => {
                    return pRej(err);
                });
        });
    }

    /**
     * Queries the DB for a list of all joke IDs the client has in their joke cache.
     * @param {string} clientIpHash 64-character IP hash of the client
     * @param {string} langCode Language code of the joke to cache
     * @returns {Promise<number[], string>} An array of joke IDs
     */
    listEntries(clientIpHash, langCode)
    {
        return new Promise((pRes, pRej) => {
            if(!JokeCache.isValidClientIpHash(clientIpHash))
                throw new TypeError(`Parameter "clientIpHash" is not a string or not a valid IP hash`);

            if(!isValidLang(langCode))
                throw new TypeError(`Parameter "langCode" is not a valid language code`);

            const insValues = [
                this.table,
                clientIpHash,
                langCode
            ];

            sendQuery(this.db, `SELECT JokeID FROM ?? WHERE ClientIpHash = ? AND LangCode = ?;`, insValues)
                .then(res => {
                    res = res.map(itm => itm.JokeID).sort();

                    return pRes(res);
                }).catch(err => {
                    return pRej(err);
                });
        });
    }

    /**
     * Checks if a provided client IP hash is valid.
     * @param {string} clientIpHash
     * @returns {boolean}
     */
    static isValidClientIpHash(clientIpHash)
    {
        return (typeof clientIpHash == "string" && clientIpHash.length == 64 && clientIpHash.match(settings.httpServer.ipHashing.hashRegex));
    }
}

module.exports = JokeCache;
