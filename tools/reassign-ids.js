// this reassigns all jokes' IDs. Always run this after something changes in the joke's order
// run this with the command "npm run reassign-ids"

try {
    const fs = require("fs");
    const isEmpty = require("svjsl").isEmpty;
    const settings = require("../settings");

    console.log(`\nReassigning joke IDs in file "${settings.jokes.jokesFilePath}"...`);

    let initialJokes = JSON.parse(fs.readFileSync(settings.jokes.jokesFilePath).toString()).jokes;
    let initialInfo = JSON.parse(fs.readFileSync(settings.jokes.jokesFilePath).toString()).info;

    let reassignedJokes = [];

    if(initialInfo.formatVersion != 2)
        initialInfo.formatVersion = 2;

    initialJokes.forEach((joke, i) => {
        let rJoke = joke;
        rJoke.id = i;
        reassignedJokes.push(rJoke);
    });

    let doneFile = {
        info: initialInfo,
        jokes: reassignedJokes
    };

    fs.writeFileSync(settings.jokes.jokesFilePath, JSON.stringify(doneFile, null, 4));


    console.log("Done reassigning joke IDs.\n");
    process.exit(0);
}
catch(err)
{
    console.log(`\n\n\x1b[31m\x1b[1m>> Error while reassigning joke IDs:\n${err}\n\n\x1b[0m`);
    process.exit(1);
}