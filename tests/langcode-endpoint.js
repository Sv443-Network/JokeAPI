const { XMLHttpRequest } = require("xmlhttprequest");
const jsl = require("svjsl");

const settings = require("../settings");

const meta = {
    name: "Langcode",
    category: "Endpoint",
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

        let run = () => new Promise(runResolve => {
            let sendXHR = language => {
                return new Promise((xhrResolve, xhrReject) => {
                    jsl.unused(xhrReject);
                    let xhr = new XMLHttpRequest();
                    xhr.open("GET", `${baseURL}/langcode/${language}`); // < set endpoint here

                    xhr.onreadystatechange = () => {
                        if(xhr.readyState == 4)
                        {
                            if(xhr.status >= 200 && xhr.status < 300)
                            {
                                let resp = JSON.parse(xhr.responseText);
                                return xhrResolve({ input: language, code: resp.code || null });
                            }
                            else if(xhr.status == 400)
                                return xhrResolve({ input: language, code: null });
                            else
                            {
                                errors.push(`Couldn't reach endpoint - HTTP status: ${xhr.status}`);
                                return runResolve();
                            }
                        }
                    };

                    xhr.send();
                });
            };

            let promises = [];
            let langs = [
                { lang: "german", expectedCode: "de" },
                { lang: "g3rm4n", expectedCode: "de" },
                { lang: "Azerbaijani", expectedCode: "az" },
                { lang: "Luxembourg", expectedCode: "lb" },
                { lang: "invalid_language_xyz", expectedCode: null },
            ];
            
            langs.forEach(l => {
                let lang = l.lang;
                promises.push(sendXHR(lang));
            });
            
            Promise.all(promises).then(vals => {
                vals.forEach(val => {
                    if(typeof val == "object")
                    {
                        let filterRes = langs.filter(lval => lval.lang == val.input)[0];
                        if(filterRes.expectedCode != val.code)
                            errors.push(`Code of language "${val.input}" didn't match the expected value (expected "${filterRes.expectedCode}" but got "${val.code}")`);
                    }
                });

                return runResolve();
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
