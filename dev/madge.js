// IMPORTANT:
// Madge needs the Graphviz software to generate the SVG graphs.
// 
// On Windows, download it here: https://graphviz.gitlab.io/download/, then add the path to the "bin" folder to your PATH variable or specify the path to the bin folder in the "madgeOptions" object below.
// On Linux, run "sudo apt-get install graphviz"
// On Mac, run "brew install graphviz || port install graphviz"
//
// To add files to be included in the graphing process, add them to the "otherFiles" array below (path is relative to project root).
// Before running this script by using "node dev/madge", make sure all dev dependencies are installed by running the command "npm i --save-dev"


const madgeOptions = {
    // graphVizPath: "C:/Users/fes/Desktop/Graphviz/bin" // set to null to use the path inside the PATH environment variable
    graphVizPath: null
};

const otherFiles = [
    "./JokeAPI.js"
];





const madge = require("madge");
const fs = require("fs-extra");
const settings = require("../settings");

var fileList = [];
var firstIframePos = {url: "./madge/JokeAPI.html", name: "./JokeAPI"};
let isWindows = process.platform == "win32";

if(isWindows && !process.env.PATH.toLowerCase().includes("graphviz") && madgeOptions.graphVizPath == null)
{
    console.log("\x1b[31m\x1b[1m\nMadge needs the GraphViz software to generate the SVG graphs. Please download it (https://graphviz.gitlab.io/download/) and add it to your PATH environment variable.\nAlso make sure the path to it contains the word \"Graphviz\"\x1b[0m");
    process.exit(1);
}

const generateForOther = () => {
    let iterCount = 0;

    return new Promise((resolve, reject) => {
        otherFiles.forEach(file => {
            if(!file.endsWith(".js"))
            {
                iterCount++;
                return;
            }

            let filename = file.replace(/\.js/g, "");

            try
            {
                madge(`${file}`, madgeOptions)
                .then((res) => res.svg())
                .then((output) => {
                    iterCount++;
                    fs.writeFileSync(`./dev/madge/${filename}.html`, output.toString());

                    if(iterCount == otherFiles.length)
                    resolve();
                });

                fileList.push(`<li><span class="mimica" onclick="setIframe('./madge/${filename}.html', '${filename}')">${filename}.js</span></li>`);
            }
            catch(err)
            {
                reject(err);
            }
        });
    });
}

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
                madge(`./src/${file}`, madgeOptions)
                .then((res) => res.svg())
                .then((output) => {
                    iterCount++;
                    fs.writeFileSync(`./dev/madge/src-${filename}.html`, output.toString());

                    if(iterCount == srcFiles.length)
                    resolve();
                });

                fileList.push(`<li><span class="mimica" onclick="setIframe('./madge/src-${filename}.html', '${filename}')">src/${filename}.js</span></li>`);
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
                madge(`./endpoints/${file}`, madgeOptions)
                .then((res) => res.svg())
                .then((output) => {
                    iterCount++;
                    fs.writeFileSync(`./dev/madge/endpoints-${filename}.html`, output.toString());

                    if(iterCount == endpointFiles.length)
                    resolve();
                });

                fileList.push(`<li><span class="mimica" onclick="setIframe('./madge/endpoints-${filename}.html', '${filename}')">endpoints/${filename}.js</span></li>`);
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
                madge(`./tools/${file}`, madgeOptions)
                .then((res) => res.svg())
                .then((output) => {
                    iterCount++;
                    fs.writeFileSync(`./dev/madge/tools-${filename}.html`, output.toString());

                    if(iterCount == toolFiles.length)
                    resolve();
                });

                fileList.push(`<li><span class="mimica" onclick="setIframe('./madge/tools-${filename}.html', '${filename}')">tools/${filename}.js</span></li>`);
            }
            catch(err)
            {
                reject(err);
            }
        });
    });
}

const generateForClasses = () => {
    let iterCount = 0;
    let classesFiles = fs.readdirSync("./src/classes");
    return new Promise((resolve, reject) => {
        classesFiles.forEach(file => {
            if(!file.endsWith(".js"))
            {
                iterCount++;
                return;
            }

            let filename = file.replace(/\.js/g, "");

            try
            {
                madge(`./src/classes/${file}`, madgeOptions)
                .then((res) => res.svg())
                .then((output) => {
                    iterCount++;
                    fs.writeFileSync(`./dev/madge/classes-${filename}.html`, output.toString());

                    if(iterCount == classesFiles.length)
                    resolve();
                });

                fileList.push(`<li><span class="mimica" onclick="setIframe('./madge/classes-${filename}.html', '${filename}')">classes/${filename}.js</span></li>`);
            }
            catch(err)
            {
                reject(err);
            }
        });
    });
}

const generateForTests = () => {
    let iterCount = 0;
    let testsFiles = fs.readdirSync("./tests");
    return new Promise((resolve, reject) => {
        testsFiles.forEach(file => {
            if(!file.endsWith(".js") || file == "template.js")
            {
                iterCount++;
                return;
            }

            let filename = file.replace(/\.js/g, "");

            try
            {
                madge(`./tests/${file}`, madgeOptions)
                .then((res) => res.svg())
                .then((output) => {
                    iterCount++;
                    fs.writeFileSync(`./dev/madge/tests-${filename}.html`, output.toString());

                    if(iterCount == testsFiles.length)
                    resolve();
                });

                fileList.push(`<li><span class="mimica" onclick="setIframe('./madge/tests-${filename}.html', '${filename}')">tests/${filename}.js</span></li>`);
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
        <title>${settings.info.name} Dependency Graph</title>
        <style>
            body {font-family: "Source Sans Pro", "Segoe UI", sans-serif; margin: 5px; overflow-x: hidden;}
            .mimica {color: #00e; cursor: pointer;}
            .mimica:active {color: #000;}
            #iframe {width: 100%; height: 100%; border: none; margin-left: 15px;}
            #ifrtd {position: relative; display: inline-block; height: 100%; width: 100%;}
            #listtd {position: relative; display: inline-block; height: 100%;}
            table, table tr {width: 98vw;}
            #iframewrapper {width: 100%; height: 100%;}

            #flexcontainer {display: flex; flex-direction: row; flex-wrap: nowrap; min-height: 99vh;}
            .flexitem {flex-grow: 0;}
            .flexitem.grow {flex-grow: 3; padding-left: 20px;}

            h2 {margin-bottom: 10px; margin-top: 16px;}

            footer {position: fixed; bottom: 10px; right: 10px;}
        </style>
        <script>
            function onLoad()
            {
                setIframe("${firstIframePos.url}", "${firstIframePos.name}");
            }
            function setIframe(url, name)
            {
                document.getElementById("iframe").src = url;
                document.getElementById("selectedgraphtitle").innerHTML = name + ".js:";
            }
        </script>
    </head>
    <body onload="onLoad()">
        <div id="flexcontainer">
            <div class="flexitem">
                <ul>
                    ${fileList.join("\n\t\t\t\t\t")}
                </ul>
                <br><br>
                Blue has dependencies.<br>
                Green has no dependencies.<br>
                Red has circular dependencies.
            </div>
            <div class="flexitem grow">
                <h2 id="selectedgraphtitle"></h2>
                <iframe id="iframe"></iframe>
            </div>
        </div>
        <footer>
            Generated with <a href="https://www.npmjs.com/package/madge" target="_blank">Madge</a>
        </footer>
    </body>
</html>`;




async function exec()
{
    try
    {
        if(!fs.existsSync("./dev/madge"))
            fs.mkdirSync("./dev/madge");

        await generateForOther();
        process.stdout.write(".");

        await generateForSrc();
        process.stdout.write(".");

        await generateForEndpoints();
        process.stdout.write(".");

        await generateForTools();
        process.stdout.write(".");

        await generateForClasses();
        process.stdout.write(".");

        await generateForTests();
        process.stdout.write(".");

        writeIndex();
        process.stdout.write(".\n");
    }
    catch(err)
    {
        console.log(`\n\n\x1b[31m\x1b[1mError while generating dependency graphs:\n\x1b[0m${err}\n`);
        process.exit(1);
    }
}

exec();
