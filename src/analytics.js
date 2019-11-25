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
                    console.log(res);
                    if(typeof res != "object" || res.length <= 0)
                    {
                        let createAnalyticsTableQuery = fs.readFileSync(`${settings.analytics.dirPath}create_analytics.sql`).toString();
                        sendQuery(createAnalyticsTableQuery).then(res2 => {
                            console.log(res2);
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
 * General internal error
 * @param {("HTTP")} type 
 * @param {String} error 
 */
const internalError = (type, error) => {
    jsl.unused(error);
    switch(type)
    {
        case "HTTP":

        break;
    }
}

/**
 * IP address was rate limited
 * @param {String} ip The IP address of the request sender
 */
const rateLimited = (ip) => {
    jsl.unused(ip);

}

module.exports = { init, internalError, rateLimited, sendQuery, endSqlConnection }