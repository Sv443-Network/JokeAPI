const madge = require("madge");
const fs = require("fs");
const settings = require("../settings");


var fileList = [];

const generateForSrc = () => {
    let iterCount = 0;
    let srcFiles = fs.readdirSync("./src");
    return new Promise((resolve, reject) => {
        srcFiles.forEach(file => {
            if(!file.endsWith(".js"))
            {
                iterCount++;
                return;
            }

            let filename = file.replace(/\.js/g, "");

            try
            {
                madge(`./src/${file}`)
                .then((res) => res.svg())
                .then((output) => {
                    iterCount++;
                    fs.writeFileSync(`./dev/madge/src-${filename}.html`, output.toString());

                    if(iterCount == srcFiles.length)
                    resolve();
                });

                fileList.push(`<li><span class="mimica" onclick="setIframe('./madge/src-${filename}.html')">src/${filename}.js</span></li>`);
            }
            catch(err)
            {
                reject(err);
            }
        });
    });
}

const generateForEndpoints = () => {
    let iterCount = 0;
    let endpointFiles = fs.readdirSync("./endpoints");
    return new Promise((resolve, reject) => {
        endpointFiles.forEach(file => {
            if(!file.endsWith(".js"))
            {
                iterCount++;
                return;
            }

            let filename = file.replace(/\.js/g, "");

            try
            {
                madge(`./endpoints/${file}`)
                .then((res) => res.svg())
                .then((output) => {
                    iterCount++;
                    fs.writeFileSync(`./dev/madge/endpoints-${filename}.html`, output.toString());

                    if(iterCount == endpointFiles.length)
                    resolve();
                });

                fileList.push(`<li><span class="mimica" onclick="setIframe('./madge/endpoints-${filename}.html')">endpoints/${filename}.js</span></li>`);
            }
            catch(err)
            {
                reject(err);
            }
        });
    });
}

const generateForTools = () => {
    let iterCount = 0;
    let toolFiles = fs.readdirSync("./tools");
    return new Promise((resolve, reject) => {
        toolFiles.forEach(file => {
            if(!file.endsWith(".js"))
            {
                iterCount++;
                return;
            }

            let filename = file.replace(/\.js/g, "");

            try
            {
                madge(`./tools/${file}`)
                .then((res) => res.svg())
                .then((output) => {
                    iterCount++;
                    fs.writeFileSync(`./dev/madge/tools-${filename}.html`, output.toString());

                    if(iterCount == toolFiles.length)
                    resolve();
                });

                fileList.push(`<li><span class="mimica" onclick="setIframe('./madge/tools-${filename}.html')">tools/${filename}.js</span></li>`);
            }
            catch(err)
            {
                reject(err);
            }
        });
    });
}

const writeIndex = () => {
    let index = getIndex();
    fs.writeFileSync("./dev/dependency-graph.html", index);

    console.log(`\n\n\x1b[32m\x1b[1mSuccessfully generated dependency graphs for ${fileList.length} files.\n\x1b[0m`);
    process.exit(0);
}

const getIndex = () => `\
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Index - ${settings.info.name} Dependency Graph</title>
        <style>
            body {font-family: "Source Sans Pro", "Segoe UI", sans-serif; margin: 5px; overflow-x: hidden;}
            .mimica {color: #00e; cursor: pointer;}
            .mimica:active {color: #000;}
            #iframe {width: 100%; height: 100%; border: none; margin-left: 15px;}
            #ifrtd {position: relative; display: inline-block; height: 100%; width: 100%;}
            #listtd {position: relative; display: inline-block; height: 100%;}
            table, table tr {width: 98vw;}
            #iframewrapper {width: 100%; height: 100%;}

            #flexcontainer {display: flex; flex-direction: row; flex-wrap: nowrap;}
            .flexitem {flex-grow: 0;}
            .flexitem.grow {flex-grow: 3;}
        </style>
        <script>
            function setIframe(url)
            {
                document.getElementById("iframe").src = url;
            }
        </script>
    </head>
    <body>
        <div id="flexcontainer">
            <div class="flexitem">
                <h2>${settings.info.name} Dependency Graphs:</h2>

                <ul>
                    ${fileList.join("\n\t\t\t")}
                </ul>

                <br>

                Generated with <a href="https://www.npmjs.com/package/madge" target="_blank">Madge</a>
            </div>
            <div class="flexitem grow">
                <iframe id="iframe">
            </div>
        </div>
    </body>
</html>`;





try
{
    if(!fs.existsSync("./dev/madge"))
        fs.mkdirSync("./dev/madge");

    generateForSrc().then(() => {
        generateForEndpoints().then(() => {
            generateForTools().then(() => {
                writeIndex();
            });
        });
    });
}
catch(err)
{
    console.log(`\n\n\x1b[31m\x1b[1mError while generating dependency graphs:\n\x1b[0m${err}\n`);
    process.exit(1);
}