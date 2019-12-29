const readline = require("readline");
const jsl = require("svjsl");
const settings = require("../settings");

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.pause();



const init = () => {
    let joke = {};

    getJokeCategory().then(cat => {
        joke["category"] = cat;
        getJokeType().then(type => {
            joke["type"] = type;

            let contFlags = () => {
                // TODO: flags + ID + save to file
            };

            if(type != "twopart")
            {
                rl.resume();
                rl.question("Enter Joke: ", jokeText => {
                    rl.pause();
                    joke["joke"] = jokeText;

                    contFlags();
                });
            }
            else
            {
                rl.resume();
                rl.question("Enter Joke Setup: ", jokeSetup => {
                    rl.question("Enter Joke Delivery: ", jokeDelivery => {
                        rl.pause();
                        joke["setup"] = jokeSetup;
                        joke["delivery"] = jokeDelivery;

                        contFlags();
                    });
                });
            }

            console.log(joke);
        });
    });
};

const getJokeCategory = () => {
    return new Promise((resolve) => {
        let catMP = new jsl.MenuPrompt({
            retryOnInvalid: true,
            onFinished: res => {
                resolve(settings.jokes.possible.categories[res[0].optionIndex]);
            }
        });
        let catOptions = [];
        settings.jokes.possible.categories.forEach((cat, i) => {
            catOptions.push({
                key: (i + 1),
                description: cat
            });
        });
        catMP.addMenu({
            title: "Choose Category",
            options: catOptions
        });
        catMP.open();
    });
};

const getJokeType = () => {
    return new Promise((resolve) => {
        let typeMP = new jsl.MenuPrompt({
            retryOnInvalid: true,
            onFinished: res => {
                resolve(settings.jokes.possible.types[res[0].optionIndex]);
            }
        });
        let typeOptions = [];
        settings.jokes.possible.types.forEach((type, i) => {
            typeOptions.push({
                key: (i + 1),
                description: type
            });
        });
        typeMP.addMenu({
            title: "Choose Joke Type",
            options: typeOptions
        });
        typeMP.open();
    });
}

init();