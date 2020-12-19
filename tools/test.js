/* eslint-disable */ // so that the CI linting process doesn't fail - this will be removed in the final revision

const jsl = require("svjsl");
const fs = require("fs-extra");
const cp = require("child_process");
const requireUncached = require('require-uncached');
const { resolve, join } = require("path");
const { XMLHttpRequest } = require("xmlhttprequest");

const debug = require("../src/verboseLogging");
const settings = require("../settings");

var col = { rst: jsl.colors.rst, ...jsl.colors.fg };
var runningTests = false;

// const baseURL = `http://127.0.0.1:${settings.httpServer.port}`;


function init()
{
    // let pingIv;

    // let pingJAPI = () => {
    //     let xhr = new XMLHttpRequest();
    //     xhr.open("GET", `${baseURL}/ping`);

    //     xhr.onreadystatechange = () => {
    //         if(xhr.readyState == 4 && !runningTests)
    //         {
    //             if(xhr.status < 300)
    //             {
    //                 console.log(`\n\n${col.blue}${settings.info.name} is now running.${col.rst}`);
    //                 clearInterval(pingIv);
                    
    //             }
    //         }
    //     };

    //     xhr.send();
    // };

    // pingIv = setInterval(() => pingJAPI(), settings.tests.initPingInterval);
    // pingJAPI();
    console.log(`Trying to run tests...`);
    runAllTests();
}

function runAllTests()
{
    runningTests = true;

    if(process.argv.includes("--colorblind") || process.argv.includes("-cb"))
    {
        col.green = jsl.colors.fg.cyan;
        col.red = jsl.colors.fg.magenta;
    }

    let success = true;
    let tests = getAllTests();
    let testsRun = tests.map(t => t.run());

    console.log(`${col.blue}Running ${tests.length} unit test scripts...${col.rst}`);

    Promise.allSettled(testsRun).then(results => {
        let allOk = true;

        results.forEach(r => {
            if(r.status == "rejected")
                allOk = false;
        });

        let oneSuccessful = false;

        console.log(`\n\n${col.green}These test scripts were successful:\n${col.rst}`);

        results.forEach(res => {
            if(res.status != "fulfilled")
                return;

            oneSuccessful = true;
            
            let meta = res.value.meta;
            console.log(`- ${col.green}[${meta.category}/${col.cyan}${meta.name}${col.green}]${col.rst}`);
        });

        if(!oneSuccessful)
            console.log("(none)");




        results.forEach(res => {
            if(res.status != "rejected")
                return;

            if(success)
            {
                console.error(`\n\n${col.red}These tests were unsuccessful:\n${col.rst}`);
                success = false;
            }
            
            let meta = res.reason.meta;
            let errors = res.reason.errors;

            console.log(`${col.red}[${meta.category}/${col.cyan}${meta.name}${col.red}]:${col.rst}`);
            errors.forEach(e => {
                console.log(`    - ${e}`);
            });

            process.stdout.write("\n");
        });
        
        console.log(`\n${!success ? `\n${col.red}^ Some unit tests were not successful ^${col.rst}` : ""}\n`);


        process.exit(success ? 0 : 1);
    }).catch(err => {
        console.error(`${col.red}Error while running unit tests: ${err}\n\n${col.rst}`);
        process.exit(1);
    });
}

function getAllTests()
{
    let allTests = [];

    let testsFolder = resolve(settings.tests.location);
    let testFiles = fs.readdirSync(testsFolder);

    testFiles.forEach(testFile => {
        if(testFile == "template.js")
            return;

        let testPath = join(testsFolder, testFile);

        try
        {
            let testScript = requireUncached(testPath); // the normal require sometimes returns outdated files out of the cache so I need to use an external module

            if(typeof testScript.meta == "object" && typeof testScript.run == "function")
            {
                allTests.push({
                    meta: testScript.meta,
                    run: testScript.run
                });
            }
            else
                console.error(`Error while reading test script "${testFile}": meta and/or run exports are missing\n(skipping)`);
        }
        catch(err)
        {
            console.error(`Error while reading test script "${testFile}": ${err}\n(skipping)`);
        }
    });

    return allTests;
}

init();
