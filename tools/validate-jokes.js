const jsl = require("svjsl");
const settings = require("../settings");


// TODO: rework this


console.log(`\nValidating jokes-xy.json files in "${settings.jokes.jokesFolderPath}"...\n`);

require("../src/parseJokes").init().then(() => {
    console.log(`${jsl.colors.fg.green}All jokes are valid.${jsl.colors.rst}\n`);
    process.exit(0);
}).catch(err => {
    console.log(`${jsl.colors.fg.red}${err}${jsl.colors.rst}\n`);
    process.exit(1);
});
