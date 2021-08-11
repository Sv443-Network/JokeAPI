const http = require("http");

const resolveIP = require("../src/resolveIP");
const parseURL = require("../src/parseURL");


const port = 8074;


async function run()
{
    await parseURL.init();

    http.createServer((req, res) => {
        const rawIP = resolveIP(req, true);
        const hashedIP = resolveIP(req);
        const url = parseURL(req.url);

        let ipInfo = `IP Info:\n`;
        ipInfo += `    URL:     /${url.pathArray.join("/")}\n`
        ipInfo += `    Method:  ${req.method}\n`;
        ipInfo += `    Raw IP:  ${rawIP}\n`;
        ipInfo += `    Hashed:  ${hashedIP}\n`;

        console.log(ipInfo);

        res.writeHead(200, { "Content-Type": "text/plain; charset=UTF-8" });
        res.end(ipInfo);
    }).listen(port, undefined, err => {
        if(err)
        {
            console.error(`Error: ${err}`);
            process.exit(1);
        }
        else
            console.info(`Ready. Listening at http://127.0.0.1:${port}\n`)
    });
}

run();
