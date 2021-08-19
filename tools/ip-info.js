const http = require("http");

const { getClientIp } = require("request-ip");
const scl = require("svcorelib");

const { hashIP } = require("../src/resolveIP");
const parseURL = require("../src/parseURL");

const colors = [ scl.colors.fg.green, scl.colors.fg.blue, scl.colors.fg.yellow, scl.colors.fg.magenta, scl.colors.fg.cyan, scl.colors.fg.white, scl.colors.fg.red ];


const colorCycle = process.argv.includes("--color-cycle") || process.argv.includes("-c");


const port = 8074;

const padding = "    ";


async function run()
{
    await parseURL.init();

    let colorIdx = 0;

    http.createServer((req, res) => {
        const rawIP = getClientIp(req);
        const hashedIP = hashIP(rawIP);
        const url = parseURL(req.url);

        let col = "";

        if(colorCycle)
        {
            colorIdx++;

            if(colorIdx == colors.length)
                colorIdx = 0;

            col = colors[colorIdx];
        }

        let ipInfo = `> IP Info: \n`;
        ipInfo += `${padding}URL:     /${url.pathArray.join("/")} \n`
        ipInfo += `${padding}Method:  ${req.method} \n`;
        ipInfo += `${padding}Raw IP:  ${rawIP} \n`;
        ipInfo += `${padding}Hashed:  ${hashedIP} \n`;
        ipInfo += `${padding}Time:    ${Date.now()} \n`

        console.log(`${col}${ipInfo}${scl.colors.rst}\n`);

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
