/*
    Pass --generate-json to generate JSON data file
*/

const fs = require("fs");
const options = {
    SOURCE_FILE: "changelog.txt",
    DATA_FILE: "changelog-data.json",
    OUTPUT_FILE: "CHANGELOG.md",
};

function extractVersionArray(versionLines = []) {
    const versionsObj = {};
    let currentVersion = "";

    versionLines.forEach((line) => {
        if (line.startsWith("[")) {
            currentVersion = line;
        } else {
            let prevItems = versionsObj[currentVersion] || [];
            versionsObj[currentVersion] = [...prevItems, line.slice(4)];
        }
    });

    // versionObj will be in this format
    // {
    //  "version-title": [
    //      "entry-1",
    //      "entry-2"
    //  ]
    // }

    return Object.entries(versionsObj).map(
        ([versionTitle, versionEntries]) => ({
            versionTitle,
            versionEntries,
        })
    );
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

    if (process.argv.includes("--generate-json")) {
        fs.writeFileSync(options.DATA_FILE, JSON.stringify(jsonData, null, 4));
    }
    return jsonData;
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

    fs.writeFileSync(
        options.OUTPUT_FILE,
        outputLines
            .join("\n")
            // convert issue references to links
            .replace(
                /issue \#(\d{1,})/g,
                "[issue #$1](https://github.com/Sv443/JokeAPI/issues/$1)"
            )
    );
}

function generateMD() {
    const data = extractData();

    writeMD(data);
}

generateMD();
