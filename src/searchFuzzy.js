const Fuse = require("fuse.js");
const settings = require("../settings");

/**
 * Does a fuzzy search through a passed array and returns an array with all matches where the lowest index is the best match
 * @param {Array<*>} array 
 * @param {String} searchPattern 
 * @returns {Array<*>}
 */
const searchFuzzy = (array, searchPattern) => {
    let fuzzySearch = new Fuse(array, settings.searchFuzzy);
    return fuzzySearch.search(searchPattern);
};

module.exports = searchFuzzy;