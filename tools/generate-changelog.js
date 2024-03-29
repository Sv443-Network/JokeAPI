/**
 * Pass --generate-json to generate JSON data file
 * @author sahithyandev
 */

const fs = require("fs-extra");
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
        }),
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
    },
) {
    let outputLines = [
        `# JokeAPI Changelog (Version ${data["currentVersion"]})`,
        "",
    ];

    data.versions.forEach((versionObj) => {
        let versionContent = [
            "<br><br><br>\n\n## " + versionObj.versionTitle,
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
                /issue #(\d{1,})/g,
                "[issue #$1](https://github.com/Sv443/JokeAPI/issues/$1)",
            )
            // convert pull request references to links
            .replace(
                /PR #(\d{1,})/g,
                "[pull request #$1](https://github.com/Sv443/JokeAPI/pull/$1)",
            )
        + `<br><br><br>\n\nThis file was auto-generated from the source file at [./${options.SOURCE_FILE}](./${options.SOURCE_FILE})`,
    );

    console.log(`\x1b[32m\x1b[1mGenerated changelog at ./${options.OUTPUT_FILE}\n\x1b[0m`);
}

function generateMD() {
    const data = extractData();

    writeMD(data);
}

generateMD();
