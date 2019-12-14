const http = require("http");
const jsl = require("svjsl");
const sql = require("mysql");
const fs = require("fs");
const logger = require("./logger");
const settings = require("../settings");
const debug = require("./verboseLogging");
jsl.unused(http);


/**
 * Initializes the Analytics module by setting up the MySQL connection
 * @returns {Promise} Returns a promise
 */
const init = () => {
    return new Promise((resolve, reject) => {
        if(!settings.analytics.enabled)
            return resolve();

        let sqlConnection = sql.createConnection({
            host: settings.sql.host,
            user: settings.sql.dbUser,
            password: process.env["DB_PASSWORD"],
            database: settings.sql.database,
            port: settings.sql.port,
            connectTimeout: settings.sql.timeout * 1000
        });

        sqlConnection.connect(err => {
            if(err)
                return reject(`${err}\nMaybe the database server isn't running or doesn't allow the connection.\nAlternatively, set the property "analytics.enabled" in the file "settings.js" to "false"`);
            else
            {
                this.sqlConn = sqlConnection;
                module.exports.sqlConn = sqlConnection;

                sendQuery("SHOW TABLES LIKE \"analytics\"").then(res => {
                    if(typeof res != "object" || res.length <= 0)
                    {
                        let createAnalyticsTableQuery = fs.readFileSync(`${settings.analytics.dirPath}create_analytics.sql`).toString();
                        sendQuery(createAnalyticsTableQuery).then(() => {
                            module.exports.connectionInfo = {
                                connected: true,
                                info: `${settings.sql.host}:${settings.sql.port}/${settings.sql.database}`
                            };
                            return resolve();
                        }).catch(err => {
                            return reject(`${err}\nMaybe the database server isn't running or doesn't allow the connection.\nAlternatively, set the property "analytics.enabled" in the file "settings.js" to "false"`);
                        });
                    }
                    else
                    {
                        module.exports.connectionInfo = {
                            connected: true,
                            info: `${settings.sql.host}:${settings.sql.port}/${settings.sql.database}`
                        };
                        return resolve();
                    }
                }).catch(err => {
                    return reject(`${err}\nMaybe the database server isn't running or doesn't allow the connection.\nAlternatively, set the property "analytics.enabled" in the file "settings.js" to "false"`);
                });
            }
        });

        sqlConnection.on("error", err => {
            logger("error", `SQL connection error: ${err}`, true);
        });
    });
};

/**
 * Ends the SQL connection
 * @returns {Promise}
 */
const endSqlConnection = () => {
    return new Promise((resolve) => {
        this.sqlConn.end(err => {
            if(err)
                this.sqlConn.destroy();
            resolve();
        });
    });
};

/**
 * Sends a formatted (SQLI-protected) query
 * @param {String} query The SQL query with question marks where the values are
 * @param {Array<String>} insertValues The values to insert into the question marks
 * @returns {Promise} Returns a Promise - resolves with the query results or rejects with the error string
 */
const sendQuery = (query, insertValues) => {
    return new Promise((resolve, reject) => {
        if(jsl.isEmpty(this.sqlConn) || (this.sqlConn.state != "connected" && this.sqlConn.state != "authenticated"))
            return reject(`DB connection is not established yet. Current connection state is "${this.sqlConn.state || "disconnected"}"`);

        debug("SQL", `Sending query: "${query}" with values "${(typeof insertValues == "object") ? insertValues.join(",") : "(empty)"}"`);

        this.sqlConn.query({
            sql: (typeof insertValues == "object" && insertValues.length > 0) ? this.sqlConn.format(query, insertValues) : query,
            timeout: settings.sql.timeout * 1000
        }, (err, result) => {
            if(err) return reject(err);
            else
            {
                try
                {
                    if(resolve)
                        return resolve(JSON.parse(JSON.stringify(result)));
                }
                catch(err)
                {
                    return reject(err);
                }
            }
        });
    });
};

/**
 * @typedef {Object} AnalyticsSuccessfulRequest
 * @prop {("SuccessfulRequest")} type
 * @prop {Object} data
 * @prop {String} data.ipAddress
 * @prop {Array<String>} data.urlPath
 * @prop {Object} data.urlParameters
 */

/**
 * @typedef {Object} AnalyticsRateLimited
 * @prop {("RateLimited")} type
 * @prop {Object} data
 * @prop {String} data.ipAddress
 * @prop {Array<String>} data.urlPath
 * @prop {Object} data.urlParameters
 */

/**
 * @typedef {Object} AnalyticsError
 * @prop {("Error")} type
 * @prop {Object} data
 * @prop {String} data.ipAddress
 * @prop {Array<String>} data.urlPath
 * @prop {Object} data.urlParameters
 * @prop {String} data.errorMessage
 */

/**
 * @typedef {Object} AnalyticsSubmission
 * @prop {("JokeSubmission")} type
 * @prop {Object} data
 * @prop {String} data.ipAddress
 * @prop {Array<String>} data.urlPath
 * @prop {Object} data.urlParameters
 * @prop {Object} data.submission
 */

/**
 * Logs something to the analytics database
 * @param {(AnalyticsSuccessfulRequest|AnalyticsRateLimited|AnalyticsError|AnalyticsSubmission)} analyticsDataObject The analytics data
 * @returns {(Boolean|String)} Returns a string containing an error message if errored, else returns true
 */
const logAnalytics = analyticsDataObject => {
    try
    {
        let type = analyticsDataObject.type;

        if(!settings.analytics.enabled)
            return true;
        
        if(jsl.isEmpty(this.sqlConn) || (this.sqlConn.state != "connected" && this.sqlConn.state != "authenticated"))
            return `DB connection is not established yet. Current connection state is "${this.sqlConn.state || "disconnected"}"`;

        let writeObject = {
            type: type,
            ipAddress: analyticsDataObject.data.ipAddress || null,
            urlPath: (analyticsDataObject.data.urlPath != null ? JSON.stringify(analyticsDataObject.data.urlPath) : null) || null,
            urlParameters: (analyticsDataObject.data.urlParameters != null ? JSON.stringify(analyticsDataObject.data.urlParameters) : null) || null,
            errorMessage: analyticsDataObject.data.errorMessage || null,
            submission: (analyticsDataObject.data.submission != null ? JSON.stringify(analyticsDataObject.data.submission) : null) || null
        };
        
        if(!["SuccessfulRequest", "RateLimited", "Error", "JokeSubmission"].includes(type))
            return `Analytics log type "${type}" is invalid`;

        sendQuery("INSERT INTO ?? (aID, aType, aIpAddress, aUrlPath, aUrlParameters, aErrorMessage, aSubmission, aTimestamp) VALUES (NULL, ?, ?, ?, ?, ?, ?, NULL)", [
            settings.analytics.sqlTableName,
            writeObject.type,
            writeObject.ipAddress,
            writeObject.urlPath,
            writeObject.urlParameters,
            writeObject.errorMessage,
            writeObject.submission
        ]).catch(err => {
            return logger("error", `Error while saving analytics data to database - Error: ${err}\nAnalytics Data: ${writeObject}`, true);
        });
    }
    catch(err)
    {
        return logger("error", `Error while preparing analytics data - Error: ${err}`, true);
    }
};

module.exports = logAnalytics;
module.exports.init = init;
module.exports.sendQuery = sendQuery;
module.exports.endSqlConnection = endSqlConnection;