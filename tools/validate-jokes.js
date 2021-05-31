const jsl = require("svjsl");
const settings = require("../settings");
const promiseSeq = require("promise-all-sequential")



console.log(`\nValidating jokes-xy.json files in "${settings.jokes.jokesFolderPath}"...\n`);

const initStages = [
    require("../src/languages").init(),
    require("../src/translate").init()
];

promiseSeq(initStages).then(async () => {
    try
    {
        await require("../src/parseJokes").init();
        console.log(`${jsl.colors.fg.green}All jokes are valid.${jsl.colors.rst}\n`);
        process.exit(0);
    }
    catch(err)
    {
        console.log(`${jsl.colors.fg.red}Error while validating jokes:${jsl.colors.rst}\n${err}\n`);
        process.exit(1);
    }
}).catch(err => {
    console.log(`${jsl.colors.fg.red}Error while initializing:\n${jsl.colors.rst}${err}\n`);
    process.exit(1);
});
