const jsl = require("svjsl");
const readline = require("readline");
const settings = require("../settings");
const fs = require("fs");

// TODO: rework all of this

const init = () => {
    let joke = {};

    process.stdin.setRawMode(true);

    getJokeCategory().then(cat => {
        joke["category"] = cat;
        getJokeType().then(type => {
            joke["type"] = type;

            let rl = readline.createInterface(process.stdin, process.stdout);
            rl.pause();

            let contFlags = () => {
                process.stdout.write("\n");

                joke["flags"] = {};
                let allFlags = settings.jokes.possible.flags;

                let flagIteration = idx => {
                    if(idx >= allFlags.length)
                        return flagIterFinished();
                    else
                    {
                        jsl.pause(`Is this joke ${allFlags[idx]}? (y/N):`).then(key => {
                            if(key.toLowerCase() == "y")
                                joke["flags"][allFlags[idx]] = true;
                            else joke["flags"][allFlags[idx]] = false;

                            return flagIteration(++idx);
                        }).catch(err => {
                            console.error(`Error: ${err}`);
                            return process.exit(1);
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
                                    console.log(`${jsl.colors.fg.green}\nJoke was successfully added:${jsl.colors.rst}\n\n${JSON.stringify(joke, null, 4)}\n\n\n`);

                                    jsl.pause("Add another joke? (y/N): ").then(key => {
                                        if(key.toLowerCase() === "y")
                                        {
                                            console.clear();
                                            return init();
                                        }
                                        else return process.exit(0);
                                    }).catch(err => {
                                        console.error(`Error: ${err}`);
                                        return process.exit(1);
                                    });
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

            console.log(`Use "\\n" for a line break. Special characters like double quotes do not need to be escaped.\n`);

            if(type != "twopart")
            {
                rl.resume();
                rl.question("Enter Joke: ", jokeText => {
                    rl.pause();
                    joke["joke"] = jokeText.replace(/\\n/gm, "\n");

                    return contFlags();
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

                        return contFlags();
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
            },
            autoSubmit: true
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
            },
            autoSubmit: true
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
