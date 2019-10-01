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
            religious: isEmpty(joke.religious) ? false : true,
            political: isEmpty(joke.political) ? false : true
        },
        id: id
    });

    id++;
});

fs.writeFileSync("./data/jokes_new.json", JSON.stringify(newJokes, null, 4));

console.log("Done reformatting jokes.\n");