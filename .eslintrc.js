module.exports = {
    "env": {
        "commonjs": true,
        "es2021": true,
        "node": true,
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 13,
    },
    "rules": {
        "indent": [
            "error",
            4,
        ],
        "linebreak-style": [
            "error",
            "unix",
        ],
        "quotes": [
            "error",
            "double",
        ],
        "semi": [
            "error",
            "always",
        ],
        "no-async-promise-executor": "off",
        "no-unused-vars": "warn",
        "comma-dangle": [
            "error",
            "always-multiline",
        ],
    },
};
