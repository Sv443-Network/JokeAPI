const { isEmpty, colors } = require("svcorelib");
const sql = require("mysql");
const fs = require("fs-extra");

const logger = require("./logger");
const debug = require("./debug");

const settings = require("../settings");

/** @typedef {import("./types/analytics").AnalyticsObject} AnalyticsObject */


module.exports.connectionInfo = {
    connected: false,
    info: "(not initialized yet)"
};


/**
 * Initializes the Analytics module by setting up the MySQL connection
 * @returns {Promise<void, string>} Returns a promise
 */
function init()
{
    return new Promise((resolve, reject) => {
        if(!settings.analytics.enabled)
            return resolve();
        
        const dbUser = process.env["DB_USERNAME"];
        const dbPass = process.env["DB_PASSWORD"];

        const sqlConnection = sql.createConnection({
            host: settings.sql.host,
            user: (dbUser || ""),
            password: (dbPass || ""),
            database: settings.sql.database,
            port: settings.sql.port
        });

        sqlConnection.connect(err => {
            if(err)
            {
                debug("SQL", `Error while connecting to DB: ${err}`);
                return reject(`${err}\nMaybe the database server isn't running or doesn't allow the connection.\nAlternatively, set the property "analytics.enabled" in the file "settings.js" to "false"`);
            }
            else
            {
                debug("SQL", `Successfully connected to database at ${colors.fg.green}${settings.sql.host}:${settings.sql.port}/${settings.sql.database}${colors.rst}`);

                this.sqlConn = sqlConnection;
                module.exports.sqlConn = sqlConnection;

                sendQuery("SHOW TABLES LIKE \"analytics\"").then(res => {
                    if(typeof res != "object" || res.length <= 0)
                    {
                        debug("SQL", `DB table doesn't exist, creating it...`);
                        let createAnalyticsTableQuery = fs.readFileSync(`${settings.analytics.dirPath}create_analytics.sql`).toString();
                        sendQuery(createAnalyticsTableQuery).then(() => {
                            module.exports.connectionInfo = {
                                connected: true,
                                info: `${settings.sql.host}:${settings.sql.port}/${settings.sql.database}`
                            };
                            debug("SQL", `Successfully created analytics DB, analytics init is done`);
                            return resolve();
                        }).catch(err => {
                            debug("SQL", `Error while creating DB table: ${err}`);
                            return reject(`${err}\nMaybe the database server isn't running or doesn't allow the connection.\nAlternatively, set the property "analytics.enabled" in the file "settings.js" to "false"`);
                        });
                    }
                    else
                    {
                        debug("SQL", `DB table exists, analytics init is done`);
                        module.exports.connectionInfo = {
                            connected: true,
                            info: `${settings.sql.host}:${settings.sql.port}/${settings.sql.database}`
                        };
                        return resolve();
                    }
                }).catch(err => {
                    debug("SQL", `Error while detecting analytics table in DB: ${err}`);
                    return reject(`${err}\nMaybe the database server isn't running or doesn't allow the connection.\nAlternatively, set the property "analytics.enabled" in the file "settings.js" to "false"`);
                });
            }
        });

        sqlConnection.on("error", err => {
            logger("error", `SQL connection error: ${err}`, true);
        });
    });
}

/**
 * Ends the SQL connection
 * @returns {Promise<void>}
 */
function endSqlConnection()
{
    return new Promise((resolve) => {
        if(!this.sqlConn)
            return resolve();

        this.sqlConn.end(err => {
            if(err)
                this.sqlConn.destroy();
            resolve();
        });
    });
}

/**
 * Sends a formatted (SQLI-protected) query
 * @param {string} query The SQL query with question marks where the values are
 * @param {string[]} insertValues The values to insert into the question marks - use the primitive type null for an empty value
 * @returns {Promise<object, string>} Returns a Promise - resolves with the query results or rejects with the error string
 */
function sendQuery(query, insertValues)
{
    return new Promise((resolve, reject) => {
        if(isEmpty(this.sqlConn) || (this.sqlConn && this.sqlConn.state != "connected" && this.sqlConn.state != "authenticated"))
            return reject(`DB connection is not established yet. Current connection state is "${this.sqlConn.state || "disconnected"}"`);

        debug("SQL", `Sending query: "${query.replace(/"/g, "'")}" with values "${(typeof insertValues == "object") ? insertValues.map((v) => (v == null ? "NULL" : v)).join(",").replace(/"/g, "'") : "(empty)"}"`);

        this.sqlConn.query({
            sql: (typeof insertValues == "object" && insertValues.length > 0) ? this.sqlConn.format(query, insertValues) : query,
            timeout: settings.sql.timeout * 1000
        }, (err, result) => {
            if(err)
            {
                debug("SQL", `Error while sending query: ${err}`);
                return reject(err);
            }
            else
            {
                try
                {
                    if(resolve)
                        return resolve(JSON.parse(JSON.stringify(result)));
                }
                catch(err)
                {
                    debug("SQL", `Error while sending query: ${err}`);
                    return reject(err);
                }
            }
        });
    });
}

/**
 * Logs something to the analytics database
 * @param {AnalyticsObject} analyticsDataObject The analytics data
 * @returns {boolean|string} Returns a string containing an error message if errored, else returns true. Also returns true if the analytics module is disabled
 */
function logAnalytics(analyticsDataObject)
{
    if(!settings.analytics.enabled)
        return true;

    try
    {
        const { type } = analyticsDataObject;

        if(isEmpty(type))
            return `Analytics log type "${type}" is invalid`;
        
        if(isEmpty(this.sqlConn) || (this.sqlConn && this.sqlConn.state != "connected" && this.sqlConn.state != "authenticated"))
        {
            debug("Analytics", `Error while logging some analytics data - SQL connection state is invalid: ${this.sqlConn.state || "disconnected"}`);
            return `DB connection is not established yet. Current connection state is "${this.sqlConn.state || "disconnected"}"`;
        }

        const writeValues = [
            type,
            analyticsDataObject.data.ipAddress || null,
            (analyticsDataObject.data.urlPath != null ? JSON.stringify(analyticsDataObject.data.urlPath) : null) || null,
            (analyticsDataObject.data.urlParameters != null ? JSON.stringify(analyticsDataObject.data.urlParameters) : null) || null,
            analyticsDataObject.data.errorMessage || null,
            (analyticsDataObject.data.submission != null ? JSON.stringify(analyticsDataObject.data.submission) : null) || null
        ];

        sendQuery("INSERT INTO ?? (aID, aType, aIpAddress, aUrlPath, aUrlParameters, aErrorMessage, aSubmission, aTimestamp) VALUES (NULL, ?, ?, ?, ?, ?, ?, NULL)", [
            settings.analytics.sqlTableName,
            ...writeValues,
        ]).then(() => {
            debug("Analytics", `Successfully logged some analytics data to the DB`);
        }).catch(err => {
            debug("Analytics", `Error while logging some analytics data - query returned error: ${err}`);
            return logger("error", `Error while saving analytics data to database - Error: ${err}\nAnalytics Data: ${writeValues.join(" ; ")}`, true);
        });
    }
    catch(err)
    {
        debug("Analytics", `General error while preparing analytics data: ${err}`);
        return logger("error", `Error while preparing analytics data - Error: ${err}`, true);
    }
}

/**
 * idk why this function exists, maybe I'll remember later on
 */
function rateLimited()
{
    return;
}

module.exports = logAnalytics;
module.exports.init = init;
module.exports.sendQuery = sendQuery;
module.exports.endSqlConnection = endSqlConnection;
module.exports.rateLimited = rateLimited;
