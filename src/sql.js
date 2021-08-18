const { reserialize } = require("svcorelib");
const mysql = require("mysql");

const settings = require("../settings");


/** @type {mysql.QueryOptions} */
const queryOptions = {
    timeout: settings.sql.timeout
};


/**
 * Sends a formatted SQL query using init()'s DB connection instance
 * @param {mysql.Connection} connection
 * @param {string} query
 * @param  {...any} [values]
 * @returns {Promise<object, string>}
 */
function sendQuery(connection, query, ...values)
{
    if(!connection || typeof connection.query !== "function")
        throw new Error(`Error while sending query: DB connection isn't established yet`);

    return new Promise((res, rej) => {
        /** @type {mysql.QueryOptions} */
        const opts = {
            ...reserialize(queryOptions),
            sql: mysql.format(query, values)
        };

        connection.query(opts, (err, result) => {
            if(err)
                return rej(err);

            return res(result);
        });
    });
}


module.exports = { sendQuery };
