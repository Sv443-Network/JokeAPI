/*
    Pass --generate-json to generate JSON data
*/

const fs = require("fs");
const sourceFile = "changelog.txt";
const dataFile = "changelog-data.json";
const outputFile = "CHANGELOG.md";

function extractVersionArray(lines) {
    const versionsObj = {};
    let lastVersion = "";
    for (let line of lines) {
        if (line.startsWith("[")) {
            lastVersion = line;
        } else {
            let prevItems = versionsObj[lastVersion] || [];
            versionsObj[lastVersion] = [...prevItems, line.slice(4)];
        }
    }

    // versionObj will be in this format
    // {
    //  "version-title": [
    //      "entry-1",
    //      "entry-2"
    //  ]
    // }

    return Object.entries(versionsObj).map(([key, items]) => {
        return {
            versionTitle: key,
            versionEntries: items,
        };
    });
}

function extractData() {
    const source = fs.readFileSync(sourceFile, "utf-8");
    const output = {
        currentVersion: source.match(/- Version (\d\.\d\.\d) -/)[1],
        versions: [],
    };

    let lines = source
        .split("\n")
        .filter((line) => line != "")
        .slice(4);

    output.versions = extractVersionArray(lines);

    if (process.argv.includes("--generate-json")) {
        fs.writeFileSync(dataFile, JSON.stringify(output, null, 4));
    }
    writeMD(output);
}

function writeMD(
    data = {
        currentVersion: "",
        versions: [],
    }
) {
    let outputLines = [
        `# JokeAPI Changelog (Version ${data["currentVersion"]})`,
        "",
    ];

    data.versions.forEach((versionObj) => {
        let versionContent = [
            "## " + versionObj.versionTitle,
            ...versionObj.versionEntries,
        ];

        outputLines.push(...versionContent, "\n");
    });

    fs.writeFileSync(outputFile, outputLines.join("\n"));
}

extractData();
