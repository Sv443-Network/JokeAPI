const mysql = require("mysql");
const { sql, colors } = require("svcorelib");
const fs = require("fs-extra");

const debug = require("./debug");
const JokeCache = require("./classes/JokeCache");

const settings = require("../settings");


/** @type {JokeCache} Globally usable joke cache instance. Always use this instance to modify the cache! */
var cache;
module.exports.cache = cache;
module.exports.connectionInfo = {};


/**
 * Initializes the joke cache module and instantiates the `cache` instance.
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
                    debug("JokeCache", `Successfully connected to database at ${colors.fg.yellow}${settings.sql.host}:${settings.sql.port}/${settings.sql.database}${colors.rst}`);

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

module.exports.init = init;
