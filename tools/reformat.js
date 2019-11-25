// this reformats jokes from the old <1.1.3 format to the new 2.0.0 format
// run this with the command "npm run reformat"

try
{
    const fs = require("fs");
    const isEmpty = require("svjsl").isEmpty;


    console.log(`\nReformatting jokes from file "./data/jokes.json" to new format and putting it in file "./data/jokes_new.json"...`);

    let initialJokes = JSON.parse(fs.readFileSync("./data/jokes.json").toString());
    let newJokes = [];
    let id = 0;

    initialJokes.forEach(joke => {
        if(joke.type == "single") newJokes.push({
            category: joke.category,
            type: "single",
            joke: joke.joke,
            flags: {
                nsfw: isEmpty(joke.nsfw) ? false : true,
                racist: isEmpty(joke.racist) ? false : true,
                sexist: isEmpty(joke.sexist) ? false : true,
                religious: isEmpty(joke.religious) ? false : true,
                political: isEmpty(joke.political) ? false : true
            },
            id: id
        });

        if(joke.type == "twopart") newJokes.push({
            category: joke.category,
            type: "twopart",
            setup: joke.setup,
            delivery: joke.delivery,
            flags: {
                nsfw: isEmpty(joke.nsfw) ? false : true,
                racist: isEmpty(joke.racist) ? false : true,
                sexist: isEmpty(joke.sexist) ? false : true,
                religious: isEmpty(joke.religious) ? false : true,
                political: isEmpty(joke.political) ? false : true
            },
            id: id
        });

        id++;
    });

    let doneFile = {
        "info": {
            "formatVersion": 2
        },
        "jokes": newJokes
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