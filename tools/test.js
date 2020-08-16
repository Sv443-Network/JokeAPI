/* eslint-disable */ // so that the CI linting process doesn't fail - this will be removed in the final revision

const jsl = require("svjsl");
const fs = require("fs-extra");
const requireUncached = require('require-uncached');
const { resolve, join } = require("path");

const debug = require("../src/verboseLogging");
const settings = require("../settings");

var col = { rst: jsl.colors.rst, ...jsl.colors.fg };


function runAllTests()
{
    if(process.argv.includes("--colorblind") || process.argv.includes("-cb"))
    {
        col.green = jsl.colors.fg.cyan;
        col.red = jsl.colors.fg.magenta;
    }

    let success = true;
    let tests = getAllTests();
    let testsRun = tests.map(t => t.run());

    console.log(`\n\n${col.blue}Running ${tests.length} unit test scripts...${col.rst}`);

    Promise.allSettled(testsRun).then(results => {
        let allOk = true;

        results.forEach(r => {
            if(r.status == "rejected")
                allOk = false;
        });

        if(!allOk)
        {
            success = false;
            let oneSuccessful = false;

            console.log(`\n${col.green}These tests were successful:\n${col.rst}`);

            results.forEach(res => {
                if(res.status != "fulfilled")
                    return;

                oneSuccessful = true;
                
                let meta = res.value.meta;
                console.log(`- ${col.green}[${meta.category}/${col.cyan}${meta.name}${col.green}]${col.rst}`);
            });

            if(!oneSuccessful)
                console.log("(none)");

            console.log("\n\n");




            console.error(`${col.red}These tests were unsuccessful:\n${col.rst}`);

            results.forEach(res => {
                if(res.status != "rejected")
                    return;
                
                let meta = res.reason.meta;
                let errors = res.reason.errors;

                console.log(`${col.red}[${meta.category}/${col.cyan}${meta.name}${col.red}]:${col.rst}`);
                errors.forEach(e => {
                    console.log(`    - ${e}`);
                });

                process.stdout.write("\n");
            });
        }
        else
        {
            console.log(`${col.green}All unit tests were successful.${col.rst}`);
        }
        
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
        let testPath = join(testsFolder, testFile);

        try
        {
            let testScript = requireUncached(testPath);

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

runAllTests();
