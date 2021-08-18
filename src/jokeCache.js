const mysql = require("mysql");
const { colors } = require("svcorelib");
const fs = require("fs-extra");

const debug = require("./debug");
const JokeCache = require("./classes/JokeCache");
const { sendQuery } = require("./sql");

const settings = require("../settings");


//#MARKER types

/**
 * @typedef {object} ConnectionInfo
 * @prop {boolean} connected
 * @prop {string} info
 */

//#MARKER other

/** @type {JokeCache} Globally usable joke cache instance. Always use this instance to modify the cache! */
let cacheInstance;
module.exports.cacheInstance = cacheInstance;
/** @type {ConnectionInfo} */
module.exports.connectionInfo = {
    connected: false
};

//#MARKER init

/**
 * Initializes the joke cache module and instantiates the `cache` instance.
 * @returns {Promise<undefined, string>}
 */
function init()
{
    return new Promise((pRes, pRej) => {
        debug("JokeCache", `Initializing...`);

        //#SECTION setup DB connection

        /** Database connection used for joke caching */
        const dbConnection = mysql.createConnection({
            host: settings.sql.host,
            user: (process.env["DB_USERNAME"] || ""),
            password: (process.env["DB_PASSWORD"] || ""),
            database: settings.sql.database,
            port: settings.sql.port,
            insecureAuth: false,
        });

        //#SECTION finalize
        /**
         * Finalizes joke cache setup, then resolves init()'s returned Promise
         * @param {mysql.Connection} connection
         */
        const finalize = async (connection) => {
            try
            {
                module.exports.connectionInfo = {
                    connected: true,
                    info: `${settings.sql.host}:${settings.sql.port}/${settings.sql.database}`
                };

                cacheInstance = new JokeCache(connection);
                module.exports.cacheInstance = cacheInstance;

                // initial GC run
                await cacheInstance.runGC(connection);

                debug("JokeCache", "Successfully initialized joke cache and garbage collector");
                return pRes();
            }
            catch(err)
            {
                return pRej(`Error while finalizing joke cache setup: ${err}`);
            }
        };

        //#SECTION establish DB connection, ensure table exists
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
                    sendQuery(dbConnection, `SHOW TABLES LIKE ?;`, settings.jokeCaching.tableName)
                        .then(res => {
                            if(Array.isArray(res) && res.length >= 1)
                            {
                                // connection established, table exists already
                                debug("JokeCache", `DB table exists already`);

                                return finalize(dbConnection);
                            }
                            else if(Array.isArray(res) && res.length == 0)
                            {
                                // connection established, table doesn't exist
                                debug("JokeCache", `DB table doesn't exist, creating it...`);
                                const createAnalyticsTableQuery = fs.readFileSync(settings.jokeCaching.createTableFile).toString();

                                sendQuery(dbConnection, createAnalyticsTableQuery)
                                    .then(() => {
                                        debug("JokeCache", `Successfully created joke caching DB`);
                                        return finalize(dbConnection);
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

module.exports = { init };
