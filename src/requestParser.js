const jsl = require("svjsl");
const fs = require("fs");
var js2xml = require("js2xmlparser");
const YAML = require("json-to-pretty-yaml");

const settings = require("./settings.js");


module.exports = (req, res) => {
    var selectedJoke = "EMPTY";
    var jokeCategory = req.url.split("/category/")[1].split("?")[0];

    let urlParamsRaw = req.url.split("/category/")[1].split("?")[1];
    let urlParamsArr = (urlParamsRaw != (null || "" || undefined) && urlParamsRaw.length > 0 ? urlParamsRaw.split("&") : []);
    var urlParams = {};
    for(let i = 0; i < urlParamsArr.length; i++) {
        urlParams[urlParamsArr[i].split("=")[0]] = urlParamsArr[i].split("=")[1];
    }

    fs.readFile(settings.jokePath, (err, allJokes) => {
        if(jsl.isEmpty(err)) {
            allJokes = JSON.parse(allJokes);
            for(let i = 0; i < allJokes.length; i++) allJokes[i].id = i;
            var possibleJokes = [];
            var gt = false;
            if(jokeCategory.toLowerCase() != "any") {
                for(let i = 0; i < allJokes.length; i++) {
                    if(allJokes[i].category == jokeCategory) {
                        gt = true;

                        let blFlags = [];
                        if(urlParams != null && urlParams.blacklistFlags != null) {
                            urlParams.blacklistFlags.split(",").forEach(flag => {
                                blFlags.push(flag);
                            });
                        }
                        
                        if(blFlags.length > 0) {
                            let hasBlacklistedFlag = false;
                            for(let iii = 0; iii < blFlags.length; iii++) if(allJokes[i][blFlags[iii]] === true) hasBlacklistedFlag = true;

                            if(!hasBlacklistedFlag) possibleJokes.push(allJokes[i]);
                        }
                        else possibleJokes.push(allJokes[i]);
                    }
                }
                fs.writeFileSync("./data/debug/latestPossibleJokes.json", JSON.stringify(possibleJokes, null, 4)); //DEBUG
                
                if(!gt) {
                    res.writeHead(422, "Unprocessable Input Data", {"Content-Type": "text/plain; utf-8"});
                    process.stdout.write("\x1b[31m\x1b[1m▌\x1b[0m"); //error
                    return res.end("Joke Category doesn't have the correct value.\nSend a GET request to https://sv443.net/jokeapi/categories to see all available categories.");
                }
                let rN = jsl.randRange(0, (possibleJokes.length - 1));
                if(possibleJokes.length > 0) selectedJoke = possibleJokes[rN];
                else selectedJoke = possibleJokes[0];
                // process.stdout.write("m" + rN + "/" + (possibleJokes.length - 1));
            }
            else if(jokeCategory.toLowerCase() == "any") {
                let rN = jsl.randRange(0, (allJokes.length - 1));
                // process.stdout.write("a" + rN + "/" + (data.length - 1));
                if(allJokes.length > 0) selectedJoke = allJokes[rN];
                else selectedJoke = allJokes[0];
            }

            if(urlParams.format == "xml") {
                selectedJoke = js2xml.parse("joke", selectedJoke);
                res.writeHead(200, "Ok", {"Content-Type": "application/xml; utf-8"});
                process.stdout.write("\x1b[32m\x1b[1m▌\x1b[0m"); //success
                return res.end(selectedJoke);
            }
            else if(urlParams.format == "yaml") {
                selectedJoke = YAML.stringify({"joke": selectedJoke});
                res.writeHead(200, "Ok", {"Content-Type": "application/x-yaml; utf-8"});
                process.stdout.write("\x1b[32m\x1b[1m▌\x1b[0m"); //success
                return res.end(selectedJoke);
            }
            else {
                selectedJoke = JSON.stringify(selectedJoke, null, "\t");
                res.writeHead(200, "Ok", {"Content-Type": "application/json; utf-8"});
                process.stdout.write("\x1b[32m\x1b[1m▌\x1b[0m"); //success
                return res.end(selectedJoke);
            }
        }
        else {
            console.log("\n\x1b[31m\x1b[1m Got error while reading jokes file: \x1b[0m" + err);
            res.writeHead(500, "Internal Server Error", {"Content-Type": "text/plain; utf-8"});
            process.stdout.write("\x1b[31m\x1b[1m▌\x1b[0m"); //error
            return res.end("Internal Error - Couldn't read jokes.json file - full error message: " + err);
        }
    });
}