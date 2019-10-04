const Fuse = require("fuse.js");

/**
 * Does a fuzzy search through a passed array and returns an array with all matches where the lowest index is the best match
 * @param {Array<*>} array 
 * @param {String} searchPattern 
 * @returns {Array<*>}
 */
const searchFuzzy = (array, searchPattern) => {
    let fuzzySearch = new Fuse(array, {
        shouldSort: true,
        tokenize: true,
        threshold: 0.6,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
    })
    return fuzzySearch.search(searchPattern);
};

module.exports = searchFuzzy;