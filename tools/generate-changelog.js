/**
 * Pass --generate-json to generate JSON data file
 * @author sahithyandev
 */

const fs = require("fs-extra");
const semver = require("semver");
const { colors } = require("svcorelib");

const col = colors.fg;

const options = {
    SOURCE_FILE: "changelog.txt",
    DATA_FILE: "changelog-data.json",
    OUTPUT_FILE: "changelog.md",
};

function extractVersionArray(versionLines = []) {
    const versionsObj = {};
    let currentVersion = "";

    versionLines.forEach((line) => {
        if (line.startsWith("[")) {
            currentVersion = line;
        } else {
            let trimmedLine = line;
            trimmedLine = trimmedLine.replace(/^\t/, "");
            trimmedLine = trimmedLine.replace(/^\s{4}/, "");

            let prevItems = versionsObj[currentVersion] || [];
            versionsObj[currentVersion] = [...prevItems, trimmedLine];
        }
    });

    // versionObj will be in this format
    // {
    //  "version-title": [
    //      "entry-1",
    //      "entry-2"
    //  ]
    // }

    const versionArray = Object.entries(versionsObj).map(
        ([versionTitle, versionEntries]) => ({
            versionTitle,
            versionEntries,
        })
    );

    return versionArray;
}

function extractData() {
    const source = fs.readFileSync(options.SOURCE_FILE, "utf-8");
    const jsonData = {
        currentVersion: source.match(/- Version (\d\.\d\.\d) -/)[1],
        versions: [],
    };

    let versionData = source
        .split("\n")
        .filter((line) => line != "")
        .slice(4);

    jsonData.versions = extractVersionArray(versionData);

    return jsonData;
}

/**
 * @param {semver.SemVer} currentVersion 
 * @param {semver.SemVer[]} otherVersions 
 */
function getTableOfContents(currentVersion, otherVersions)
{
    let versionLinks = [];


    let curVerMajor = currentVersion.major;
    let curVerMinor = currentVersion.minor;

    versionLinks.push(`- ${curVerMajor}.${curVerMinor}`);

    versionLinks.push(`    - **[Current Version: ${currentVersion.version}](#${currentVersion.version.replace(/\./g, "")})**`);

    otherVersions.forEach(ver => {
        if(ver.major != curVerMajor || ver.minor != curVerMinor)
        {
            curVerMajor = ver.major;
            curVerMinor = ver.minor;

            versionLinks.push(`- ${curVerMajor}.${curVerMinor}`);
        }

        versionLinks.push(`    - [${ver.version}](#${ver.version.replace(/\./g, "")})`);
    });


    console.log("Written table of contents.");

    return [
        "## Table of Contents:",
        ...versionLinks
    ].join("  \n");
}

function writeMD(
    data = {
        currentVersion: "",
        versions: [],
    }
) {
    let currentVersionNumber = "";
    let versionNumbers = [];

    let outputLines = [];

    data.versions.forEach((versionObj) => {
        let currentVersion = versionObj.versionTitle.match(/\[CURRENT:\s*(\d+\.\d+.\d+)\]?/);
        let versionNum = versionObj.versionTitle.match(/\[(\d+\.\d+.\d+)\]?/);

        if(currentVersion)
        {
            currentVersionNumber = currentVersion[1];
            versionNum = currentVersion[1];
        }
        
        if(Array.isArray(versionNum))
        {
            versionNumbers.push(versionNum[1]);
            versionNum = versionNum[1];
        }

        let versionTitleRaw = "";
        if(versionObj.versionTitle.match(/^.*\s-\s.*$/))
            versionTitleRaw = versionObj.versionTitle.split("-")[1].trim();


        let versionContent = [];

        if(versionObj.versionTitle.toLowerCase().includes("planned"))
        {
            let plannedTitle = versionObj.versionTitle.match(/\[(.*)\]/);
            versionContent = [
                "<br><br><br>\n\n## " + plannedTitle[1] + ":  ",
                ...versionObj.versionEntries,
            ];
        }
        else
        {
            versionContent = [
                "<br><br><br>\n\n## " + (versionNum ? versionNum : versionTitleRaw) + "  ",
                (versionNum && versionTitleRaw ? "#### " + versionTitleRaw : ""),
                ...versionObj.versionEntries,
            ];
        }

        outputLines.push(...versionContent, "\n");
    });

    console.log("Prepared changelog content.");


    // insert table of contents
    outputLines.unshift(getTableOfContents(semver.parse(currentVersionNumber), versionNumbers.map(v => semver.parse(v))));

    // insert doc title
    outputLines.unshift(`# JokeAPI Changelog (Version ${data["currentVersion"]})`);


    console.log("Writing to output file...");
    fs.writeFileSync(
        options.OUTPUT_FILE,
        outputLines
            .join("\n")
            // convert issue references to links
            .replace(
                /issue #(\d{1,})/g,
                "[issue #$1](https://github.com/Sv443/JokeAPI/issues/$1)"
            )
            // convert pull request references to links
            .replace(
                /PR #(\d{1,})/g,
                "[pull request #$1](https://github.com/Sv443/JokeAPI/pull/$1)"
            )
        + `<br><br><br>\n\n<div style="text-align: center;" align="center">\n\nThis file was auto-generated from the source file at [./${options.SOURCE_FILE}](./${options.SOURCE_FILE})  \n`
        + `Thanks to [@sahithyandev](https://github.com/sahithyandev) for this feature :)\n\n</div>`
    );
}

function generateMD() {
    const data = extractData();

    writeMD(data);

    if (process.argv.includes("--generate-json") || process.argv.includes("-j")) {
        console.log(`${col.blue}Writing JSON data to ./${options.DATA_FILE}${col.rst}`);
        fs.writeFileSync(options.DATA_FILE, JSON.stringify(data, null, 4));
    }

    console.log(`\n${col.green}Generated changelog at ./${options.OUTPUT_FILE}\n${col.rst}`);

    process.exit(0);
}

generateMD();
