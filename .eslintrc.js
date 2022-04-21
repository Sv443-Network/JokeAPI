module.exports = {
    env: {
        "commonjs": true,
        "es2021": true,
        "node": true,
        "browser": true,
    },
    extends: "eslint:recommended",
    parserOptions: {
        "ecmaVersion": 2021,
    },
    ignorePatterns: [
        "docs/compiled/**",
    ],
    rules: {
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
