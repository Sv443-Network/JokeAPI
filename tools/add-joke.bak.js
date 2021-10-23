const jsl = require("svjsl");
const readline = require("readline");
const settings = require("../settings");
const fs = require("fs-extra");
const { join } = require("path");

const jokeSubmission = require("../src/jokeSubmission");
const languages = require("../src/languages");


const init = async () => {
    let joke = {};

    if(!process.stdin.isTTY)
    {
        console.log(`${jsl.colors.fg.red}Error: process doesn't have a stdin to read from${jsl.colors.rst}`);
        process.exit(1);
    }

    process.stdin.setRawMode(true);

    await languages.init();

    joke["category"] = await getJokeCategory();
    joke["type"] = await getJokeType();
    let jokeLang = await getJokeLang();

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
        
        let jokesFileName = `jokes-${jokeLang}.json`;

        let flagIterFinished = () => {
            let fPath = join(settings.jokes.jokesFolderPath, jokesFileName);

            if(!fs.existsSync(fPath))
                fs.copySync(join(settings.jokes.jokesFolderPath, settings.jokes.jokesTemplateFile), fPath);

            fs.readFile(fPath, (err, res) => {
                if(!err)
                {
                    let jokeFile = JSON.parse(res.toString());

                    joke = jokeSubmission.reformatJoke(joke);

                    joke["id"] = jokeFile.jokes.length || 0;

                    jokeFile.jokes.push(joke);

                    fs.writeFile(fPath, JSON.stringify(jokeFile, null, 4), (err) => {
                        if(err)
                        {
                            console.log(`${jsl.colors.fg.red}\n${err}${jsl.colors.rst}\n\n`);
                            process.exit(1);
                        }
                        else
                        {
                            console.clear();
                            console.log(`${jsl.colors.fg.green}\nJoke was successfully added to file "${jokesFileName}":${jsl.colors.rst}\n\n${JSON.stringify(joke, null, 4)}\n\n\n`);

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

    if(joke["type"] != "twopart")
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

function getJokeLang()
{
    return new Promise(resolve => {
        let langRL = readline.createInterface(process.stdin, process.stdout);

        let tryGetLang = () => {
            langRL.resume();
            langRL.question("Enter two-character language code (en): ", ans => {
                langRL.pause();

                if(!ans)
                    ans = settings.languages.defaultLanguage;

                ans = ans.toString().toLowerCase();

                if(languages.isValidLang(ans) === true)
                    return resolve(ans);
                else
                {
                    console.clear();
                    console.log(`\n${jsl.colors.fg.red}Invalid lang code!${jsl.colors.rst}\n\n`);
                    return tryGetLang();
                }
            });
        }

        return tryGetLang();
    });
}

init();
