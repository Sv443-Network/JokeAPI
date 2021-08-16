const mysql = require("mysql");
const { colors } = require("svcorelib");
const fs = require("fs-extra");
const promiseAllSequential = require("promise-all-sequential");

const debug = require("./debug");
const JokeCache = require("./classes/JokeCache");
const { sendQuery } = require("./sql");

const settings = require("../settings");

const col = colors.fg;


/**
 * @typedef {object} ConnectionInfo
 * @prop {boolean} connected
 * @prop {string} info
 */

/** @type {JokeCache} Globally usable joke cache instance. Always use this instance to modify the cache! */
let cacheInstance;
module.exports.cacheInstance = cacheInstance;
/** @type {ConnectionInfo} */
module.exports.connectionInfo = {
    connected: false
};

/** @type {mysql.Connection|undefined} Database connection used for joke caching */
let dbConnection = undefined;


/**
 * Initializes the joke cache module and instantiates the `cache` instance.
 * @returns {Promise<undefined, string>}
 */
function init()
{
    return new Promise((pRes, pRej) => {
        debug("JokeCache", `Initializing...`);

        dbConnection = mysql.createConnection({
            host: settings.sql.host,
            user: (process.env["DB_USERNAME"] || ""),
            password: (process.env["DB_PASSWORD"] || ""),
            database: settings.sql.database,
            port: settings.sql.port,
            insecureAuth: false,
        });

        /**
         * Finalizes joke cache setup, then resolves init()'s returned Promise
         */
        const finalize = async () => {
            try
            {
                module.exports.connectionInfo = {
                    connected: true,
                    info: `${settings.sql.host}:${settings.sql.port}/${settings.sql.database}`
                };

                cacheInstance = new JokeCache(dbConnection);
                module.exports.cacheInstance = cacheInstance;

                // set up GC
                // TODO: catch errors
                setInterval(runGC, 1000 * 60 * settings.jokeCaching.gcIntervalMinutes);
                await runGC();

                debug("JokeCache", "Successfully initialized joke cache and garbage collector");
                return pRes();
            }
            catch(err)
            {
                return pRej(`Error while finalizing joke cache setup: ${err}`);
            }
        };

        try
        {
            dbConnection.connect(async (err) => {
                if(err)
                {
                    debug("JokeCache", `Error while connecting to DB: ${err}`);
                    return pRej(err);
                }
                else
                {
                    debug("JokeCache", `Successfully connected to database at ${colors.fg.green}${settings.sql.host}:${settings.sql.port}/${settings.sql.database}${colors.rst}`);

                    // ensure DB tables exist
                    sendQuery(dbConnection, `SHOW TABLES LIKE "${settings.jokeCaching.tableName}";`)
                        .then(res => {
                            if(Array.isArray(res) && res.length >= 1)
                            {
                                // connection established, table exists already
                                debug("JokeCache", `DB table exists already`);

                                return finalize();
                            }
                            else if(Array.isArray(res) && res.length == 0)
                            {
                                // connection established, table doesn't exist
                                debug("JokeCache", `DB table doesn't exist, creating it...`);
                                const createAnalyticsTableQuery = fs.readFileSync(settings.jokeCaching.createTableFile).toString();

                                sendQuery(dbConnection, createAnalyticsTableQuery)
                                    .then(() => {
                                        debug("JokeCache", `Successfully created joke caching DB`);
                                        return finalize();
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
                            return pRej(`Error while initializing joke cache: ${err}\nMaybe the database server isn't running or doesn't allow the connection`);
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
 * Runs the joke cache garbage collector
 */
function runGC()
{
    debug("JokeCache/GC", `Running joke cache garbage collector...`);

    return new Promise(async (res, rej) => {
        /** Amount of entries that were cleared from the joke cache */
        let clearedEntries = 0;

        const startTS = Date.now();

        if(!dbConnection)
            throw new Error(`Error while running garbage collector, DB connection isn't established yet`);

        const expiredEntries = await sendQuery("SELECT * FROM ?? WHERE DATE_ADD(`DateTime`, INTERVAL ? HOUR) < CURRENT_TIMESTAMP;", settings.jokeCaching.tableName, settings.jokeCaching.expiryHours);

        /** @type {(() => Promise<any>)[]} */
        const deletePromises = [];

        expiredEntries.forEach(entry => {
            const { ClientIpHash, JokeID, LangCode } = entry;

            deletePromises.push(() => new Promise(async (delRes, delRej) => {
                try
                {
                    const result = await sendQuery("DELETE FROM ?? WHERE ClientIpHash = ? AND JokeID = ? AND LangCode = ?;", settings.jokeCaching.tableName, ClientIpHash, JokeID, LangCode);

                    if(result.affectedRows > 0)
                        clearedEntries += result.affectedRows;

                    return delRes();
                }
                catch(err)
                {
                    return delRej(err);
                }
            }));
        });

        try
        {
            await promiseAllSequential(deletePromises);
        }
        catch(err)
        {
            return rej(err);
        }

        debug("JokeCache/GC", `Cleared ${clearedEntries > 0 ? `${col.green}` : ""}${clearedEntries}${col.rst} entr${clearedEntries === 1 ? "y" : "ies"} in ${Date.now() - startTS}ms`, "green");
        return res();
    });
}

module.exports.init = init;
