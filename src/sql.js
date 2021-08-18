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
 * @param {string} query Prepared query (use ?? to denote table / column names and ? to denote values)
 * @param  {...any} [values] Rest parameter of values to insert into the query
 * @returns {Promise<object, string>}
 */
function sendQuery(connection, query, ...values)
{
    if(!connection || typeof connection.query !== "function")
        throw new Error(`Error while sending query: DB connection isn't established yet`);

    // if an array was passed instead of rest params, extract the array's values
    if(values.length === 1 && Array.isArray(values[0]))
        values = values[0];

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
