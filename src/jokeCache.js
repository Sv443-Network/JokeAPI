const mysql = require("mysql");
const { sql } = require("svcorelib");
const fs = require("fs-extra");

const debug = require("./verboseLogging");
const { isValidLang } = require("./languages");

const settings = require("../settings");


/** @type {JokeCache} */
var cache;
module.exports.cache = cache;


/**
 * Initializes the joke cache module and instantiates the `cache` export.
 * @returns {Promise<undefined, string>}
 */
function init()
{
    return new Promise((pRes, pRej) => {
        debug("JokeCache", `Initializing...`);

        let dbConnection = mysql.createConnection({
            host: settings.sql.host,
            user: (process.env["DB_USERNAME"] || ""),
            password: (process.env["DB_PASSWORD"] || ""),
            database: settings.sql.database,
            port: settings.sql.port
        });

        try
        {
            dbConnection.connect((err) => {
                if(err)
                {
                    debug("JokeCache", `Error while connecting to DB: ${err}`);
                    return pRej(err);
                }
                else
                {
                    debug("JokeCache", `Successfully connected to database at ${settings.sql.host}:${settings.sql.port}/${settings.sql.database}`);

                    /** @type {mysql.QueryOptions} */
                    let queryOptions = {
                        timeout: settings.sql.timeout
                    };

                    sql.sendQuery(dbConnection, `SHOW TABLES LIKE "${settings.jokeCaching.tableName}";`, queryOptions)
                    .then(res => {
                        if(Array.isArray(res) && res.length >= 1)
                        {
                            // connection established, table exists already
                            debug("JokeCache", `DB table exists already, joke cache init is done`);
                            module.exports.connectionInfo = {
                                connected: true,
                                info: `${settings.sql.host}:${settings.sql.port}/${settings.sql.database}`
                            };
                            
                            cache = new JokeCache(dbConnection);
                            module.exports.cache = cache;

                            return pRes();
                        }
                        else if(Array.isArray(res) && res.length == 0)
                        {
                            // connection established, table doesn't exist
                            debug("JokeCache", `DB table doesn't exist, creating it...`);
                            let createAnalyticsTableQuery = fs.readFileSync(settings.jokeCaching.createTableFile).toString();
                            sql.sendQuery(dbConnection, createAnalyticsTableQuery)
                            .then(() => {
                                module.exports.connectionInfo = {
                                    connected: true,
                                    info: `${settings.sql.host}:${settings.sql.port}/${settings.sql.database}`
                                };

                                debug("JokeCache", `Successfully created joke caching DB, analytics init is done`);
                                return pRes();
                            }).catch(err => {
                                debug("JokeCache", `Error while creating DB table: ${err}`);
                                return pRej(`${err}\nMaybe the database server isn't running or doesn't allow the connection`);
                            });
                        }
                        else
                        {
                            // connection not established or misc error from query
                            debug("JokeCache", `Unknown Error while detecting or creating joke caching table in DB: ${err}`);
                            return pRej(`${err}\nMaybe the database server isn't running or doesn't allow the connection`);
                        }
                    }).catch(err => {
                        debug("JokeCache", `Error while detecting joke caching table in DB: ${err}`);
                        return pRej(`${err}\nMaybe the database server isn't running or doesn't allow the connection`);
                    });
                }
            });
        }
        catch(err)
        {
            debug("JokeCache", `General Error: ${err}`);
            return pRej(err);
        }
    });
}


/**
 * This class is in direct contact to the SQL DB.  
 * It can add to or read from the joke ID list in the database table.  
 * This class also handles garbage collection (clearing expired entries).
 * @since 2.4.0
 */
class JokeCache {
    /**
     * Creates a new joke cache.
     * @param {mysql.Connection} dbConnection
     * @param {String|undefined} [tableName] If not provided, defaults to `settings.jokeCaching.tableName`
     */
    constructor(dbConnection, tableName)
    {
        this._db = dbConnection;
        this._table = typeof tableName == "string" ? tableName : settings.jokeCaching.tableName;

        /** @type {mysql.QueryOptions} */
        this._queryOptions = {
            timeout: settings.sql.timeout
        };
    }

    /**
     * Adds an entry to the provided client's joke cache.
     * @param {String} clientIpHash 64-character IP hash of the client
     * @param {Number} jokeID ID of the joke to cache
     * @param {String} langCode Language code of the joke to cache
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

            let insValues = [
                this._table,
                clientIpHash,
                jokeID,
                langCode
            ];

            sql.sendQuery(this._db, `INSERT INTO ?? (ClientIpHash, JokeID, LangCode) VALUES (?, ?, ?);`, this._queryOptions, ...insValues)
            .then(res => {
                return pRes(res);
            }).catch(err => {
                return pRej(err);
            });
        });
    }

    /**
     * Queries the DB for a list of all joke IDs the client has in their joke cache.
     * @param {String} clientIpHash 64-character IP hash of the client
     * @param {String} langCode Language code of the joke to cache
     * @returns {Promise<Number[], string>} An array of joke IDs
     */
    listEntries(clientIpHash, langCode)
    {
        return new Promise((pRes, pRej) => {
            if(!JokeCache.isValidClientIpHash(clientIpHash))
                throw new TypeError(`Parameter "clientIpHash" is not a string or not a valid IP hash`);

            if(!isValidLang(langCode))
                throw new TypeError(`Parameter "langCode" is not a valid language code`);
            
            let insValues = [
                this._table,
                clientIpHash,
                langCode
            ];

            sql.sendQuery(this._db, `SELECT JokeID FROM ?? WHERE ClientIpHash = ? AND LangCode = ?;`, this._queryOptions, insValues)
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

module.exports.init = init;
