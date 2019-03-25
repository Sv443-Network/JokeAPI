const jsl = require("svjsl");
const http = require("http");
const fs = require("fs");
var js2xml = require("js2xmlparser");
const YAML = require("json-to-pretty-yaml");
require('dotenv').config();

const settings = require("./settings.js");
const parseRequest = require("./requestParser.js");
const logRequest = require("./logRequest.js");
const injectDocs = require(settings.docsFolder + "/injector.js");
var liveStatLogger = {
    totalRequests: parseInt(JSON.parse(fs.readFileSync(settings.statsFilePath)).totalRequests)
};

var indexFile = injectDocs();

let lCat = [];
lCat = settings.available_categories;
lCat.push("Any");


console.log("\n\n\n\n\n\x1b[32m\x1b[1m Initializing...\x1b[0m");



var httpserver = http.createServer((req, res) => {

    let urlParamsRaw = req.url.split("?")[1];
    let urlParamsArr = (urlParamsRaw != (null || "" || undefined) && urlParamsRaw.length > 0 ? urlParamsRaw.split("&") : []);
    var urlParams = {};
    for(let i = 0; i < urlParamsArr.length; i++) {
        urlParams[urlParamsArr[i].split("=")[0]] = urlParamsArr[i].split("=")[1];
    }


    var ipaddr = req.connection.remoteAddress;
    ipaddr = (ipaddr.length<15?ipaddr:(ipaddr.substr(0,7)==='::ffff:'?ipaddr.substr(7):undefined));

    logRequest(ipaddr, req.method);

    if(!jsl.isEmpty(req.headers.joke_category)) {
        res.writeHead(200, {"Content-Type": "application/x-yaml; utf-8"});
        return res.end(JSON.stringify({
            "category": "Miscellaneous",
            "type": "single",
            "joke": "Error: Deprecated Syntax.\n\nIt looks like you are still using the old syntax for JokeAPI.\nIf you are the administrator of the service/script/whatever which sent this message, please note that JokeAPI has had a big update which also changed the syntax. The new syntax is already documented in the documentation (https://sv443.net/jokeapi).\nIf you aren't the administrator, please contact them and tell them to please re-read the documentation (https://sv443.net/jokeapi) as it now contains documentation on the new syntax.\n\nThanks and sorry if this caused any inconveniences!\n- Sv443 (Creator of JokeAPI)"
        }));
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
            res.writeHead(200, {"Content-Type": "application/xml; utf-8"});
            return res.end(xmlcats);
        }
        else if(urlParams.format == "yaml") {
            yamlcats = YAML.stringify({
                "categories": lCat
            });
            res.writeHead(200, {"Content-Type": "application/x-yaml; utf-8"});
            return res.end(yamlcats);
        }
        else {
            res.writeHead(200, {"Content-Type": "application/json; utf-8"});
            return res.end(JSON.stringify({
                "categories": lCat
            }));
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
            res.writeHead(200, {"Content-Type": "application/xml; utf-8"});
            return res.end(xmlcats);
        }
        else if(urlParams.format == "yaml") {
            res.writeHead(200, {"Content-Type": "application/x-yaml; utf-8"});
            return res.end(YAML.stringify({
                "version": settings.version,
                "jokes": {
                    "totalCount": JSON.parse(fs.readFileSync(settings.jokePath)).length,
                    "categories": lCat,
                    "flags": settings.flags,
                    "submissionURL": settings.jokeSubmissionURL
                }
            }));
        }
        else {
            res.writeHead(200, {"Content-Type": "application/json; utf-8"});
            return res.end(JSON.stringify({
                "version": settings.version,
                "jokes": {
                    "totalCount": JSON.parse(fs.readFileSync(settings.jokePath)).length,
                    "categories": lCat,
                    "flags": settings.flags,
                    "submissionURL": settings.jokeSubmissionURL
                }
            }));
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
        res.writeHead(400, {"Content-Type": "text/html; utf-8"});
        res.end(indexFile);

        liveStatLogger["totalRequests"]++;

        let oldStats = JSON.parse(fs.readFileSync(settings.statsFilePath));
        let newStats = {};
        newStats["totalRequests"] = liveStatLogger.totalRequests;
        fs.writeFileSync(settings.statsFilePath, JSON.stringify(newStats, null, 4));

        if(JSON.parse(fs.readFileSync(settings.statsFilePath)).totalRequests % 10 == 0) process.stdout.write(" ");
        return process.stdout.write("\x1b[33m\x1b[1m▌\x1b[0m"); //docs
    }
    else if(req.method == "OPTIONS") {
        res.writeHead(200, {"Content-Type": "text/html; utf-8"});
        return res.end(indexFile);
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
                            res.writeHead(200, "Ok", {"Content-Type": "text/plain;utf-8"});
                            return res.end("Success");
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
});


try {
    httpserver.listen(settings.server.port, null, function(error){
        if(!!error){
            console.log("\n\x1b[31m\x1b[1m error while initializing listener on 0.0.0.0:" + settings.server.port + " - " + error + "\x1b[0m");
            return process.exit(1);
        }
        else {
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
            process.stdout.write("\x1b[1m\x1b[32m ▌ Success   \x1b[33m▌ Docs\x1b[0m   \x1b[31m▌ Error\x1b[0m   ►>  ");
        }
    });
}
catch(err) {
    console.log("\n\x1b[31m\x1b[1m error while initializing HTTP listener on 0.0.0.0:" + settings.server.port + " - " + err + "\x1b[0m");
    return process.exit(1);
}