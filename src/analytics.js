const http = require("http");
const jsl = require("svjsl");
const sql = require("mysql");
const fs = require("fs");
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
            user: settings.sql.username,
            password: process.env["DB_PASSWORD"],
            database: settings.sql.database,
            port: settings.sql.port,
            connectTimeout: settings.sql.timeout * 1000
        });

        sqlConnection.connect(err => {
            if(err)
                return reject(err);
            else
            {
                this.sqlConn = sqlConnection;
                module.exports.sqlConn = sqlConnection;

                sendQuery("SHOW TABLES LIKE \"analytics\"").then(res => {
                    if(typeof res != "object" || res.length <= 0)
                    {
                        let createAnalyticsTableQuery = fs.readFileSync(`${settings.analytics.dirPath}create_analytics.sql`).toString();
                        sendQuery(createAnalyticsTableQuery).then(() => {
                            return resolve();
                        }).catch(err => {
                            return reject(err);
                        });
                    }
                    else return resolve();
                }).catch(err => {
                    return reject(err);
                });
            }
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
 * @returns {Promise} Returns a 
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
 */

/**
 * @typedef {Object} AnalyticsRateLimited
 * @prop {("RateLimited")} type
 * @prop {Object} data
 */

/**
 * Logs something to the analytics database
 * @param {(AnalyticsSuccessfulRequest|AnalyticsRateLimited)} analyticsDataObject
 * @returns {(Boolean|String)} Returns a string containing an error message if errored, else returns true
 */
const logAnalytics = analyticsDataObject => {
    if(!settings.analytics.enabled)
        return true;
    
    if(jsl.isEmpty(this.sqlConn) || (this.sqlConn.state != "connected" && this.sqlConn.state != "authenticated"))
        return `DB connection is not established yet. Current connection state is "${this.sqlConn.state || "disconnected"}"`;

    switch(analyticsDataObject.type)
    {
        case "SuccessfulRequest":

        break;
        case "RateLimited":

        break;
    }

    return true;
};

module.exports = logAnalytics;
module.exports = { init, sendQuery, endSqlConnection }