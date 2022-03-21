const { XMLHttpRequest } = require("xmlhttprequest");
// const {  } = require("svcorelib");

const settings = require("../settings");

const meta = {
    name: "Test Name",
    category: "Test Category",
};

const baseURL = `http://127.0.0.1:${settings.httpServer.port}`;


/**
 * @typedef {Object} UnitTestResult
 * @prop {Object} meta
 * @prop {String} meta.name
 * @prop {String} meta.category
 * @prop {Array<String>} errors
 */

/**
 * Runs this unit test
 * @returns {Promise<UnitTestResult>}
 */
function run()
{
    return new Promise((resolve, reject) => {
        let errors = [];

        let run = () => new Promise(xhrResolve => {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", `${baseURL}/ENDPOINT`); // < set endpoint here

            xhr.onreadystatechange = () => {
                if(xhr.readyState == 4)
                {
                    if(xhr.status >= 200 && xhr.status < 300)
                    {
                        // unit tests here
                    }
                    else
                    {
                        errors.push(`Couldn't reach endpoint - HTTP status: ${xhr.status}`);
                        return xhrResolve();
                    }
                }
            };

            xhr.send();
        });


        run().then(() => {
            if(errors.length == 0)
                return resolve({ meta });
            else
                return reject({ meta, errors });
        });
    });
}

module.exports = { meta, run };
