const { createConnection } = require("mysql");
const { unused } = require("svcorelib");

const debug = require("./debug");
// const { sendQuery } = require("./sql");

const settings = require("../settings");


/** @typedef {import("./types/jokeCache").ConnectionInfo} ConnectionInfo */

/** @type {ConnectionInfo} */
module.exports.connectionInfo = {
    connected: false,
};

/** @type {import("mysql").Connection} */
let conn;

//#MARKER init

/**
 * Initializes the joke cache module
 * @returns {Promise<void>}
 */
async function init()
{
    debug("JokeCache", "Initializing...");

    conn = createConnection({
        host: settings.sql.host,
        user: process.env["DB_USERNAME"] ?? "",
        password: process.env["DB_PASSWORD"] ?? "",
        database: settings.sql.database,
        port: settings.sql.port,
        insecureAuth: false,
    });

    unused(conn);

    module.exports.connectionInfo = {
        connected: true,
        info: `${settings.sql.host}:${settings.sql.port}/${settings.sql.database}`,
    };
}

module.exports = { init };
