const mysql = require("mysql");
const { unused, sql } = require("svcorelib");

const { isValidLang } = require("../languages");

const settings = require("../../settings");


unused("typedefs:", mysql);

/**
 * This class is in direct contact to the SQL DB.  
 * It can add to or read from the joke cache in the database table.  
 * It also handles garbage collection (deleting outdated entries)  
 * This class also handles garbage collection (clearing expired entries).
 * @since 2.4.0
 */
class JokeCache {
    /**
     * Creates a new joke cache.
     * @param {mysql.Connection} dbConnection
     * @param {string|undefined} [tableName] If not provided, defaults to `settings.jokeCaching.tableName`
     */
    constructor(dbConnection, tableName)
    {
        this.db = dbConnection;
        this.table = typeof tableName == "string" ? tableName : settings.jokeCaching.tableName;

        /** @type {mysql.QueryOptions} */
        this.queryOptions = {
            timeout: settings.sql.timeout
        };
    }

    /**
     * Adds an entry to the provided client's joke cache.
     * @param {string} clientIpHash 64-character IP hash of the client
     * @param {number} jokeID ID of the joke to cache
     * @param {string} langCode Language code of the joke to cache
     * @returns {Promise}
     */
    addEntry(clientIpHash, jokeID, langCode)
    {
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

            sql.sendQuery(this.db, `INSERT INTO ?? (ClientIpHash, JokeID, LangCode) VALUES (?, ?, ?);`, this.queryOptions, ...insValues)
            .then(res => {
                return pRes(res);
            }).catch(err => {
                return pRej(err);
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


            sql.sendQuery(this.db, "DELETE FROM ?? WHERE ClientIpHash LIKE ?", this.queryOptions, ...insValues).then(res => {
                return pRes(res.affectedRows ? res.affectedRows : 0);
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

            sql.sendQuery(this.db, `SELECT JokeID FROM ?? WHERE ClientIpHash = ? AND LangCode = ?;`, this.queryOptions, insValues)
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
        return (typeof clientIpHash == "string" && clientIpHash.length == 64 && clientIpHash.match(settings.jokeCaching.ipHashRegex));
    }
}

module.exports = JokeCache;
