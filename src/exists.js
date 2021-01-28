const fs = require("fs-extra");
const { resolve } = require("path");


/**
 * Wrapper for [`fs.access()`](https://nodejs.org/api/fs.html#fs_fs_access_path_mode_callback) - Checks if a file exists at the given path.
 * @param {fs.PathLike} path The path to the file - Gets passed through [`path.resolve()`](https://nodejs.org/api/path.html#path_path_resolve_paths)
 * @returns {Promise<boolean>} Resolves to a boolean - true, if the file exists, false if not
 * @throws Throws a TypeError if the `path` argument is not a string or couldn't be resolved to a valid path
 */
function exists(path)
{
    path = resolve(path);

    return new Promise((pRes) => {
        fs.access(path).then(() => {
            return pRes(true);
        }).catch(() => {
            return pRes(false);
        });
    });
}

module.exports = exists;
