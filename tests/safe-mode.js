const { XMLHttpRequest } = require("xmlhttprequest");
const jsl = require("svjsl");

const settings = require("../settings");


const baseURL = `http://127.0.0.1:${settings.httpServer.port}`;
const requestAmount = 50;


const meta = {
    name: "Safe Mode",
    category: "Parameter"
};


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

        const run = () => new Promise(xhrResolve => {
            const get = () => {
                return new Promise((pRes, pRej) => {
                    let xhr = new XMLHttpRequest();
                    xhr.open("GET", `${baseURL}/joke/Any?safe-mode&lang=xy`);

                    xhr.onreadystatechange = () => {
                        if(xhr.readyState == 4)
                        {
                            let respText = {};
                            try
                            {
                                respText = JSON.parse(xhr.responseText);
                            }
                            catch(err)
                            {
                                jsl.unused(err);
                            }

                            if(respText.safe === false)
                                errors.push(`Joke #${respText.id} is unsafe`);

                            if(xhr.status < 300)
                                return pRes({
                                    i: respText.id,
                                    s: respText.safe
                                });
                            else
                                return pRej(xhr.status);
                        }
                    };

                    xhr.send();
                });
            }

            let promises = [];
            for(let i = 0; i < requestAmount; i++)
                promises.push(get());

            Promise.all(promises).then(() => {
                return xhrResolve();
            }).catch(err => {
                jsl.unused(err);
                return xhrResolve();
            });
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
