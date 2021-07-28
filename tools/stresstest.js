const { XMLHttpRequest } = require("xmlhttprequest");


const url = "http://127.0.0.1:8076/joke/Any?amount=10";
const requestsPerInterval = 20;
const token = "v5nr5yg_stresstest"; // make sure this token exists (in file at `settings.auth.tokenListFile`) - else generate it with `npm run add-token`


function request()
{
    return new Promise((res, rej) => {
        const xhr = new XMLHttpRequest();

        xhr.open("GET", url, true);
        xhr.setRequestHeader("Authorization", token);

        xhr.onreadystatechange = () => {
            if(xhr.readyState == 4)
            {
                if(xhr.status < 300)
                {
                    try
                    {
                        const data = JSON.parse(xhr.responseText.toString());

                        if(data && Array.isArray(data.jokes) && data.jokes.length == 10)
                            return res();
                        else
                            return rej(`Data = ${typeof data} / Jokes length = ${data && Array.isArray(data.jokes) ? data.jokes.length : "invalid"}`);
                    }
                    catch(err)
                    {
                        return rej(`Parse err: ${err} - ${xhr.responseText}`);
                    }
                }
                else
                    return rej(`Unexpected HTTP status: ${xhr.status}`);
            }
        };

        xhr.send();
    });
}

let counter = 0;

function run()
{
    counter++;

    const requests = [];

    for(let i = 0; i < requestsPerInterval; i++)
        requests.push(request());

    Promise.all(requests).then(() => {
        console.log(`Iteration ${counter}: Successfully sent ${requestsPerInterval} requests`);

        run();
    }).catch(err => {
        console.error(`Iteration ${counter} - Error: ${err}`);
    });
}

run();
