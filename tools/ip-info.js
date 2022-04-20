const http = require("http");

const { getClientIp } = require("request-ip");
const scl = require("svcorelib");
const { isIPv4 } = require("net");

const { hashIP } = require("../src/resolveIP");
const parseURL = require("../src/parseURL");

const { exit } = process;

const cycleCols = [ scl.colors.fg.green, scl.colors.fg.blue, scl.colors.fg.yellow, scl.colors.fg.magenta, scl.colors.fg.cyan, scl.colors.fg.white, scl.colors.fg.red ];

const colCycleEnabled = process.argv.includes("--color-cycle") || process.argv.includes("-c");


const port = 8074;

const padding = "  ";


async function run()
{
    await parseURL.init();

    let colorIdx = 0;

    http.createServer((req, res) => {
        const rawIP = getClientIp(req);
        const hashedIP = hashIP(rawIP);
        const url = parseURL(req.url);

        let col = "";

        if(colCycleEnabled)
        {
            colorIdx++;

            if(colorIdx == cycleCols.length)
                colorIdx = 0;

            col = cycleCols[colorIdx];
        }

        let ipInfo = "";

        ipInfo += `Request info: \n`;
        ipInfo += `${padding}URL:       /${url.pathArray.join("/")} \n`;
        ipInfo += `${padding}Method:    ${req.method} \n`;
        ipInfo += `${padding}UA:        ${req.headers["user-agent"] ?? "(none)"} \n`;

        ipInfo += "\nIP info: \n";
        ipInfo += `${padding}Raw IP:    ${rawIP} (${isIPv4(rawIP) ? "v4" : "v6"}) \n`;
        ipInfo += `${padding}Hash 64:   ${hashedIP} \n`;
        ipInfo += `${padding}Hash 16:   ${hashedIP.substring(0, 16)} \n`;
        ipInfo += `${padding}Hash 8:    ${hashedIP.substring(0, 8)} \n`;
        
        ipInfo += "\nOther: \n";
        ipInfo += `${padding}Date:      ${new Date().toLocaleDateString()} \n`;
        ipInfo += `${padding}Time:      ${new Date().toLocaleTimeString()} \n`;
        ipInfo += `${padding}Unix 13:   ${Date.now()} \n`;
        ipInfo += `${padding}Unix 10:   ${Math.floor(Date.now() / 1000)} \n`;

        console.log(`${col}${ipInfo}${scl.colors.rst}\n`);

        res.writeHead(200, { "Content-Type": "text/plain; charset=UTF-8" });
        res.end(ipInfo);
    }).listen(port, undefined, err => {
        if(err)
        {
            console.error(`Error: ${err}`);
            exit(1);
        }
        else
            console.info(`Ready. Listening at http://127.0.0.1:${port}\n`);
    });
}

run();
