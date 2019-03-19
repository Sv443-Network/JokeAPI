const jsl = require("svjsl");
const fs = require("fs");

const settings = require("./settings.js");


module.exports = (ipaddr, method, jokeCategory) => {
    let writeData = new Date().toUTCString() + " - " + ipaddr + " sent " + method + " with category " + jokeCategory;
    fs.appendFileSync(settings.logPath, writeData + "\n");
}