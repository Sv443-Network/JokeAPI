// this reassigns all jokes' IDs. Always run this after something changes in the joke's order
// run this with the command "npm run reassign-ids"

const { resolve, join } = require("path");
const fs = require("fs-extra");
const settings = require("../settings");

try
{
    console.log(`\nReassigning joke IDs in files in path "${settings.jokes.jokesFolderPath}"...`);

    let totalReassignedFiles = 0;
    let totalReassignedIDs = 0;

    fs.readdirSync(settings.jokes.jokesFolderPath).forEach(fName => {
        if(fName.startsWith("template"))
            return;

        totalReassignedFiles++;

        let fPath = resolve(join(settings.jokes.jokesFolderPath, fName));
        let jokeFileObj = JSON.parse(fs.readFileSync(fPath).toString());

        let initialJokes = jokeFileObj.jokes;
        let initialInfo = jokeFileObj.info;

        let reassignedJokes = [];

        if(initialInfo.formatVersion != settings.jokes.jokesFormatVersion)
            initialInfo.formatVersion = settings.jokes.jokesFormatVersion;

        initialJokes.forEach((joke, i) => {
            let rJoke = joke;
            rJoke.id = i;
            reassignedJokes.push(rJoke);
            totalReassignedIDs++;
        });

        let doneFile = {
            info: initialInfo,
            jokes: reassignedJokes
        };

        fs.writeFileSync(fPath, JSON.stringify(doneFile, null, 4));
    });

    console.log(`\x1b[32m\x1b[1mDone reassigning IDs of all ${totalReassignedFiles} files (${totalReassignedIDs} reassigned joke IDs).\n\x1b[0m`);
    process.exit(0);
}
catch(err)
{
    console.log(`\n\n\x1b[31m\x1b[1m>> Error while reassigning joke IDs:\n${err}\n\n\x1b[0m`);
    process.exit(1);
}
