// this reformats jokes from format v2 to format v3
// run this with the command "npm run reformat"

const fs = require("fs-extra");
const { isEmpty } = require("svcorelib");

try
{
    console.log("\nReformatting jokes from file \"./data/jokes.json\" to new format and putting it in file \"./data/jokes_new.json\"...");

    let initialJokes = JSON.parse(fs.readFileSync("./data/jokes.json").toString());
    let newJokes = [];
    let id = 0;

    initialJokes.jokes.forEach(joke => {
        if(joke.type == "single") newJokes.push({
            category: joke.category,
            type: "single",
            joke: joke.joke,
            flags: {
                nsfw: isEmpty(joke.flags.nsfw) ? false : true,
                racist: isEmpty(joke.flags.racist) ? false : true,
                sexist: isEmpty(joke.flags.sexist) ? false : true,
                religious: isEmpty(joke.flags.religious) ? false : true,
                political: isEmpty(joke.flags.political) ? false : true,
                explicit: isEmpty(joke.flags.explicit) ? false : true,
            },
            id: id,
        });

        if(joke.type == "twopart") newJokes.push({
            category: joke.category,
            type: "twopart",
            setup: joke.setup,
            delivery: joke.delivery,
            flags: {
                nsfw: isEmpty(joke.flags.nsfw) ? false : true,
                racist: isEmpty(joke.flags.racist) ? false : true,
                sexist: isEmpty(joke.flags.sexist) ? false : true,
                religious: isEmpty(joke.flags.religious) ? false : true,
                political: isEmpty(joke.flags.political) ? false : true,
                explicit: isEmpty(joke.flags.explicit) ? false : true,
            },
            id: id,
        });

        id++;
    });

    let doneFile = {
        "info": {
            "formatVersion": 3,
        },
        "jokes": newJokes,
    };

    fs.writeFileSync("./data/jokes_new.json", JSON.stringify(doneFile, null, 4));

    console.log(`\x1b[32m\x1b[1mDone reformatting all ${newJokes.length} jokes.\x1b[0m\n`);
    process.exit(0);
}
catch(err)
{
    console.log(`\n\n\x1b[31m\x1b[1m>> Error while reformatting jokes:\n${err}\n\n\x1b[0m`);
    process.exit(1);
}
