const { XMLHttpRequest } = require("xmlhttprequest");
const jsl = require("svjsl");

const settings = require("../settings");


const baseURL = `http://127.0.0.1:${settings.httpServer.port}`;
const requestAmount = 50;
const defaultLang = "en";


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
        let languages = [];

        const run = () => new Promise(xhrResolve => {
            const get = () => {
                if(languages.length == 0)
                    languages = [defaultLang];

                return new Promise((pRes, pRej) => {
                    let xhr = new XMLHttpRequest();
                    let langCode = jsl.randomItem(languages);
                    xhr.open("GET", `${baseURL}/joke/Any?safe-mode&lang=${langCode}`);

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

                            if(xhr.status < 300 && xhr.status != 0)
                                return pRes({
                                    i: respText.id,
                                    s: respText.safe
                                });
                            else
                            {
                                errors.push(`Couldn't reach endpoint - HTTP status: ${xhr.status}`);
                                return pRej(xhr.status);
                            }
                        }
                    };

                    xhr.send();
                });
            }

            let langXhr = new XMLHttpRequest();
            langXhr.open("GET", `${baseURL}/languages`);
            langXhr.onreadystatechange = () => {
                if(langXhr.readyState == 4)
                {
                    if(langXhr.status < 300)
                    {
                        try
                        {
                            let data = JSON.parse(langXhr.responseText);

                            if(data.jokeLanguages)
                                languages = data.jokeLanguages;
                        }
                        catch(err)
                        {
                            jsl.unused(err);
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
                    }
                    else
                    {
                        errors.push(`Endpoint "languages" not available - status: ${langXhr.status}`);
                        return xhrResolve();
                    }
                }
            };

            langXhr.send();
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
