const jsl = require("svjsl");
const http = require("http");
const rateLimit = require("http-ratelimit");
const fs = require("fs");
var js2xml = require("js2xmlparser");
const YAML = require("json-to-pretty-yaml");
const Readable = require('stream').Readable;
require('dotenv').config();

const settings = require("./settings.js");
const parseRequest = require("./requestParser.js");
const logRequest = require("./logRequest.js");
const injectDocs = require(settings.docsFolder + "/injector.js");
var liveStatLogger = {
    totalRequests: parseInt(JSON.parse(fs.readFileSync(settings.statsFilePath)).totalRequests)
};

injectDocs();

let lCat = [];
lCat = settings.available_categories;
lCat.push("Any");


console.log("\n\n\n\n\n\x1b[32m\x1b[1m Initializing...\x1b[0m");



var httpserver = http.createServer((req, res) => {
    rateLimit.inboundRequest(req);

    // var ipaddr = req.connection.remoteAddress;
    var ipaddr = req.headers["x-forwarded-for"]; // I have to use the X-Forwarded-For header because I'm using a reverse proxy
    if(ipaddr.includes(",")) ipaddr = ipaddr.split(",")[0];
    ipaddr = (ipaddr.length<15?ipaddr:(ipaddr.substr(0,7)==='::ffff:'?ipaddr.substr(7):undefined));

    if(rateLimit.isRateLimited(req, settings.server.maxRequestsPerMinute) === true) {
        res.writeHead(429, {"Content-Type": "text/plain; utf-8"});
        res.end(`You've sent too many requests in a single minute - max is ${settings.server.maxRequestsPerMinute} requests / minute`);
        process.stdout.write("\x1b[35m\x1b[1m▌\x1b[0m"); // rate limited
        fs.appendFileSync("./data/rateLimit.log", `[${new Date().toUTCString()}]    ${ipaddr}`);
        return;
    }
    else {

        let urlParamsRaw = req.url.split("?")[1];
        let urlParamsArr = (urlParamsRaw != (null || "" || undefined) && urlParamsRaw.length > 0 ? urlParamsRaw.split("&") : []);
        var urlParams = {};
        for(let i = 0; i < urlParamsArr.length; i++) {
            urlParams[urlParamsArr[i].split("=")[0]] = urlParamsArr[i].split("=")[1];
        }


        logRequest(ipaddr, req.method);

        if(!jsl.isEmpty(req.headers.joke_category)) {
            return pipeString(res, JSON.stringify({
                "category": "Miscellaneous",
                "type": "single",
                "joke": "Error: Deprecated Syntax.\n\nIt looks like you are still using the old syntax for JokeAPI.\nIf you are the administrator of the service/script/whatever which sent this message, please note that JokeAPI has had a big update which also changed the syntax. The new syntax is already documented in the documentation (https://sv443.net/jokeapi).\nIf you aren't the administrator, please contact them and tell them to please re-read the documentation (https://sv443.net/jokeapi) as it now contains documentation on the new syntax.\n\nThanks and sorry if this caused any inconveniences!\n- Sv443 (Creator of JokeAPI)"
            }), "application/json");
        }

        if(settings.server.allowCORS) {
            try {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Request-Method', 'GET');
                res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', '*');
            }
            catch(err) {
                console.log("\x1b[31m\x1b[1m Got Error while setting up CORS headers: " + err + "\x1b[0m");
                return process.exit(1);
            }
        }
        res.setHeader('Allow', 'GET, PUT, OPTIONS');

        
        if(req.method == "GET" && req.url.includes("/categories") && (req.url.includes("/categories/") ? req.url.split("/categories/")[1].split("?")[0] == (null || "") : req.url.split("/categories")[1].split("?")[0] == (null || ""))) {
            liveStatLogger["totalRequests"]++;

            let oldStats = JSON.parse(fs.readFileSync(settings.statsFilePath));
            let newStats = {};
            newStats["totalRequests"] = liveStatLogger.totalRequests;
            fs.writeFileSync(settings.statsFilePath, JSON.stringify(newStats, null, 4));

            if(urlParams.format == "xml") {
                xmlcats = js2xml.parse("categories", {
                    "category": lCat
                });
                return pipeString(res, xmlcats, "application/xml");
            }
            else if(urlParams.format == "yaml") {
                yamlcats = YAML.stringify({
                    "categories": lCat
                });
                return pipeString(res, yamlcats, "application/x-yaml");
            }
            else {
                return pipeString(res, JSON.stringify({
                    "categories": lCat
                }), "application/json");
            }
        }
        if(req.method == "GET" && req.url.includes("/info") && (req.url.includes("/info/") ? req.url.split("/info/")[1].split("?")[0] == (null || "") : req.url.split("/info")[1].split("?")[0] == (null || ""))) {
            liveStatLogger["totalRequests"]++;

            let oldStats = JSON.parse(fs.readFileSync(settings.statsFilePath));
            let newStats = {};
            newStats["totalRequests"] = liveStatLogger.totalRequests;
            fs.writeFileSync(settings.statsFilePath, JSON.stringify(newStats, null, 4));

            if(urlParams.format == "xml") {
                xmlcats = js2xml.parse("info", {
                    "version": settings.version,
                    "jokes": {
                        "totalCount": JSON.parse(fs.readFileSync(settings.jokePath)).length,
                        "categories": {
                            "category": lCat
                        },
                        "flags": {
                            "flag": settings.flags
                        },
                        "submissionURL": settings.jokeSubmissionURL
                    }
                });
                return pipeString(res, xmlcats.toString(), "application/xml");
            }
            else if(urlParams.format == "yaml") {
                return pipeString(res, YAML.stringify({
                    "version": settings.version,
                    "jokes": {
                        "totalCount": JSON.parse(fs.readFileSync(settings.jokePath)).length,
                        "categories": lCat,
                        "flags": settings.flags,
                        "submissionURL": settings.jokeSubmissionURL
                    }
                }), "application/x-yaml");
            }
            else {
                return pipeString(res, JSON.stringify({
                    "version": settings.version,
                    "jokes": {
                        "totalCount": JSON.parse(fs.readFileSync(settings.jokePath)).length,
                        "categories": lCat,
                        "flags": settings.flags,
                        "submissionURL": settings.jokeSubmissionURL
                    }
                }), "application/json");
            }
        }
        if(req.method == "GET" && req.url.includes("/category/") && req.url.split("/category/")[1].split("?")[0] != (null || "" || undefined) && lCat.includes(req.url.split("/category/")[1].split("?")[0])) {
            if(JSON.parse(fs.readFileSync(settings.statsFilePath)).totalRequests % 10 == 0) process.stdout.write(" ");

            parseRequest(req, res);

            liveStatLogger["totalRequests"]++;

            let oldStats = JSON.parse(fs.readFileSync(settings.statsFilePath));
            let newStats = {};
            newStats["totalRequests"] = liveStatLogger.totalRequests;
            fs.writeFileSync(settings.statsFilePath, JSON.stringify(newStats, null, 4));
        }
        else if(req.method == "GET" && req.url.includes("/category/") && req.url.split("/category/")[1].split("?")[0] != (null || "" || undefined) && req.url.split("/category/")[1].split("?")[0] != (null || "" || undefined)) {
            res.writeHead(400, {"Content-Type": "text/plain; utf-8"});
            return res.end(`Wrong category${(req.url.split("/category/")[1].split("?")[0] != undefined && req.url.split("/category/")[1].split("?")[0] != null && req.url.split("/category/")[1].split("?")[0] != "") === true ? ` "${req.url.split("/category/")[1].split("?")[0]}"` : " (empty)"}.\nMake sure you spelt it correctly and also note that categories are case sensitive.\nTo get all available categories, send a GET request to https://sv443.net/jokeapi/categories`);
        }
        else if(req.method == "GET" && !req.url.includes("/category/") && (req.url.includes("/category/") ? req.url.split("/category/")[1].split("?")[0] == (null || "" || undefined) : true) && !req.url.includes("/categories")) {
            endWithDocs(res);

            liveStatLogger["totalRequests"]++;

            let oldStats = JSON.parse(fs.readFileSync(settings.statsFilePath));
            let newStats = {};
            newStats["totalRequests"] = liveStatLogger.totalRequests;
            fs.writeFileSync(settings.statsFilePath, JSON.stringify(newStats, null, 4));

            if(JSON.parse(fs.readFileSync(settings.statsFilePath)).totalRequests % 10 == 0) process.stdout.write(" ");
            return process.stdout.write("\x1b[33m\x1b[1m▌\x1b[0m"); //docs
        }
        else if(req.method == "OPTIONS") {
            endWithDocs(res);
        }
        else if(req.method == "PUT") {
            var body = '';
            req.on('data', function (data) {
                body += data;
                body = body.toString();
                if(body == process.env.RESTART_TOKEN) {
                    res.writeHead(200, "Ok", {"Content-Type": "text/plain;utf-8"});
                    res.end("RESTART_SUCCESSFUL");
                    return process.exit(2);
                }
                else {
                    try {
                        let d = new Date();
                        let filename = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}              ${d.getHours()}+${d.getMinutes()}+${d.getSeconds()}+${d.getMilliseconds()}`;
                        fs.writeFile(`./data/submittedjokes/${filename}.json`, JSON.stringify(JSON.parse(body), null, 4), err => {
                            if(!err) {
                                process.stdout.write("\x1b[36m\x1b[1m▌\x1b[0m"); // submitted joke
                                return pipeString(res, "success", "text/plain");
                            }
                            else {
                                res.writeHead(500, "Internal Server Error", {"Content-Type": "text/plain;utf-8"});
                                return res.end(`Error while writing to file: ${err}`);
                            }
                        });
                    }
                    catch(err) {
                        res.writeHead(422, {"Content-Type": "text/plain;utf-8"});
                        return res.end(err.toString());
                    }
                }
            });
        }
        else {
            res.writeHead(405, {"Content-Type": "text/plain; utf-8"});
            return res.end("wrong method, please use GET instead");
        }
    }
});


try {
    httpserver.listen(settings.server.port, null, function(error){
        if(!!error){
            console.log("\n\x1b[31m\x1b[1m error while initializing listener on 0.0.0.0:" + settings.server.port + " - " + error + "\x1b[0m");
            return process.exit(1);
        }
        else {
            rateLimit.init();
            console.log("\x1b[32m\x1b[1m > HTTP listener successfully started on 0.0.0.0:" + settings.server.port + "\x1b[0m\n");
            return true;
        }
    });
}
catch(err) {
    console.log("\n\x1b[31m\x1b[1m error while initializing HTTP listener on 0.0.0.0:" + settings.server.port + " - " + err + "\x1b[0m");
    return process.exit(1);
}

try {
    setInterval(()=>{
        indexFile = injectDocs();
    }, 1000);
    fs.readFile(settings.jokePath, (err, data) => {
        if(!err) {
            console.log("\x1b[33m\x1b[1m Loaded " + JSON.parse(data).length + " jokes\x1b[0m\n\n");
            process.stdout.write(" \x1b[32m\x1b[1m▌ Success   \x1b[33m\x1b[1m▌ Docs\x1b[0m   \x1b[31m\x1b[1m▌ Error   \x1b[35m\x1b[1m▌ Rate Limited   \x1b[36m\x1b[1m▌ Submitted Joke\x1b[0m   ►>  ");
        }
    });
}
catch(err) {
    console.log("\n\x1b[31m\x1b[1m error while initializing HTTP listener on 0.0.0.0:" + settings.server.port + " - " + err + "\x1b[0m");
    return process.exit(1);
}

function endWithDocs(res) {
    let docsFilePath = `${settings.docsFolder}/lastComplete.html`;
    let size = fs.statSync(docsFilePath).size;

    res.writeHead(200, {
        "Content-Type": "text/html; utf-8",
        "Content-Length": size
    });

    let readStream = fs.createReadStream(docsFilePath);
    readStream.pipe(res);
}

function pipeString(res, text, mimetype) {
    let s = new Readable();
    s._read = () => {};
    s.push(text);
    s.push(null);

    res.writeHead(200, {
        "Content-Type": `${mimetype}; utf-8`,
        "Content-Length": text.length
    });

    s.pipe(res);
}