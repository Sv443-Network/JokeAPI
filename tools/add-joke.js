const readline = require("readline");
const jsl = require("svjsl");
const settings = require("../settings");
const fs = require("fs");

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
                joke["flags"] = {};
                let allFlags = settings.jokes.possible.flags;

                let flagIteration = (idx) => {
                    if(idx >= allFlags.length)
                        return flagIterFinished();
                    else
                    {
                        rl.resume();
                        rl.question(`Is this joke ${allFlags[idx]}? (y/N): `, flgAns => {
                            rl.pause();

                            if(flgAns.toLowerCase() == "y")
                                joke["flags"][allFlags[idx]] = true;
                            else joke["flags"][allFlags[idx]] = false;

                            return flagIteration((idx + 1));
                        });
                    }
                };

                let flagIterFinished = () => {

                    fs.readFile(settings.jokes.jokesFilePath, (err, res) => {
                        if(!err)
                        {
                            let jokeFile = JSON.parse(res.toString());

                            joke["id"] = jokeFile.jokes.length;

                            jokeFile.jokes.push(joke);

                            fs.writeFile(settings.jokes.jokesFilePath, JSON.stringify(jokeFile, null, 4), (err) => {
                                if(err)
                                {
                                    console.log(`${jsl.colors.fg.red}\n${err}${jsl.colors.rst}\n\n`);
                                    process.exit(1);
                                }
                                else
                                {
                                    console.clear();
                                    console.log(`${jsl.colors.fg.green}\nJoke was successfully added.${jsl.colors.rst}\n\n`);
                                    process.exit(0);
                                }
                            });
                        }
                        else
                        {
                            console.log(`${jsl.colors.fg.red}\n${err}${jsl.colors.rst}\n\n`);
                            process.exit(1);
                        }
                    });
                }

                return flagIteration(0);
            };

            if(type != "twopart")
            {
                rl.resume();
                rl.question("Enter Joke: ", jokeText => {
                    rl.pause();
                    joke["joke"] = jokeText.replace(/\\n/gm, "\n");

                    contFlags();
                });
            }
            else
            {
                rl.resume();
                rl.question("Enter Joke Setup: ", jokeSetup => {
                    rl.question("Enter Joke Delivery: ", jokeDelivery => {
                        rl.pause();
                        joke["setup"] = jokeSetup.replace(/\\n/gm, "\n");
                        joke["delivery"] = jokeDelivery.replace(/\\n/gm, "\n");

                        contFlags();
                    });
                });
            }
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
};

init();