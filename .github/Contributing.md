# Contributing Guide

This guide will tell you how you can and should contribute to JokeAPI.  
Not following it might cause me to reject your changes but at the very least we will both lose time.  
So please carefully read this guide before contributing. Thanks :)

<br>

### Table of Contents:
- How to contribute:
    - [Submitting or editing jokes](#submitting-or-editing-jokes)
    - [Contributing to JokeAPI's code](#submitting-code)
    - [Submitting a translation](#submitting-translations)
- Other:
    - [Tips and tricks for contributing](#other-nice-to-know-stuff)
    - [How to submit a pull request](#submitting-a-pull-request)

<br><br>
<br><br>

## Submitting or editing jokes:
To submit a joke manually, you can use the form on [this page.](https://jokeapi.dev/#submit)  
To submit it through code, you can make use of the ["submit" endpoint.](https://jokeapi.dev/#submit-endpoint)

If you instead want to edit a joke yourself, you can find them in the `jokes-xy.json` files in [`data/jokes/`](../data/jokes/)  
To submit your changes, create a pull request. Also make sure to follow the [code contribution instructions.](#submitting-code)

If you want a joke to be edited or deleted and can't do it yourself, please submit a new issue [here.](https://github.com/Sv443/JokeAPI/issues/new?assignees=Sv443&labels=reported+joke&template=3_report_a_joke.md&title=)  
Keep in mind, though, that I will not remove jokes based on opinions as that would defeat the API's main purpose, to provide jokes for everyone's taste.

<br><br>

## Submitting code:
For a better understanding of how JokeAPI works, please consult the developer documentation [found here.](../dev/docs/home.md#readme)

1. [Read the Code_of_Conduct.md file](./Code_of_Conduct.md) (TLDR: just behave in a friendly manner).
2. [Click here](https://github.com/Sv443/JokeAPI/fork) to fork the repository. Afterwards, clone or download it and locate the folder where it is contained.
3. Make the changes you want to make to the code.
4. Run the script `npm run all` which will run these commands:
    - `npm run validate-jokes` to make sure all jokes are formatted correctly.
    - `npm run validate-ids` to verify that all jokes have the correct ID.
    - `npm run lint` to check the code for any warnings or errors.
    - `npm run dep-graph` to generate a new dependency graph.
    - `npm run generate-changelog` to generate a Markdown changelog out of the plaintext one.
    - `npm run test`, which runs the unit tests for JokeAPI. If you are colorblind, you can run the command `npm run test-colorblind` (will turn green into cyan and red into magenta).
5. Run JokeAPI locally by running the command `node JokeAPI`, request some jokes and test the areas you modified / added to make sure everything still works.
6. Add yourself to the `contributors` object in the [`package.json`](../package.json) file :)
 <!-- - **If it doesn't exist or is empty** please add it using the second format on [this website](https://flaviocopes.com/package-json/#contributors) -->
7. [Submit a pull request](#submitting-a-pull-request)

<br><br>

## Submitting Translations:
If you want to submit a translation, please follow these steps:

1. [Read the Code_of_Conduct.md file](./Code_of_Conduct.md) (TLDR: just behave in a friendly manner).
2. [Click here](https://github.com/Sv443/JokeAPI/fork) to fork the repository. Afterwards, clone or download it and locate the folder where it is contained.
3. Find your language's two-character code in the file [`data/languages.json`](../data/languages.json). You'll need to specify it for every translation.
4. Edit the following files, replicating the style of the other translations:
    - Error messages that are bound to an API error number in the file [`data/errorMessages.js`](../data/errorMessages.js)
    - General translations scattered throughout the API in the file [`data/translations/general.json`](../data/translations/general.json)
    - Endpoint translations in the file [`data/translations/endpoints.json`](../data/translations/endpoints.json)
    - Filter Component translations in the file [`data/translations/filterComponents.json`](../data/translations/filterComponents.json)
    - Splash texts in the file [`data/translations/splashes.json`](../data/translations/splashes.json)
5. Add yourself to the `contributors` object in the [`package.json`](../package.json) file :)
    - The contribution message should look like this: `Added <YourLanguage> translation`
6. [Submit a pull request](#submitting-a-pull-request)

<br><br>

## Nice to know stuff:
- I really recommend using [Visual Studio Code](https://code.visualstudio.com/) with the extension [`fabiospampinato.vscode-highlight`](https://marketplace.visualstudio.com/items?itemName=fabiospampinato.vscode-highlight) - it will add custom styling to the syntax highlighting in the editor and make the code easier to read and work with
- If you want to generate a dependency graph, run the command `npm run dep-graph` and see the command output
- If you need to add an authorization token, you can generate one or multiple tokens with the command `npm run add-token [amount]`. If you omit the "amount" parameter, the script will generate a single token. After you run the command, the tokens will be listed in the console and you can now (after restarting JokeAPI) use it in the `Authorization` header to gain unlimited access to JokeAPI [(better explanation here).](https://jokeapi.dev/#api-tokens)
- If you want to be able identify your own IP hash, you can run the IP info script with `npm run ip-info` and send any request to port `8074`

<br><br>

### Submitting a pull request:
To propose changes to JokeAPI's code, you need to submit a pull request on GitHub.  
This section teaches you how to do it:
1. Make sure you have committed and pushed (or uploaded) your changed files
2. Click the "pull request" tab on your forked repository and click "new pull request"
3. Select `Sv443/JokeAPI` as the base repo and `master` as the base branch and select `YourUsername/JokeAPI` as the head repo and `YourBranch` (`master` or `main` by default) as the compare branch
    - If your pull request is not ready to be merged yet (work in progress or needs feedback), please set your PR as a draft or add `[WIP]` to the title
4. Request a review from me (Sv443)
5. Check if the CI script and other checks for your pull request were successful (they can be found below the comments)
    - **If they were unsuccessful:** view their logs, fix the errors, commit the fixes and push to the same branch (or re-upload the changed files). This will automatically update your pull request and re-run the checks.
6. Once the pull request is approved and merged, you can delete the source branch and your forked repo if you want to
    - **If it isn't**, please read the comments from the reviewer(s) and make the necessary changes

<br><br><br><br>

### If you need any help, feel free to contact me through [Discord](https://dc.sv443.net) (fastest and easiest way) or [E-Mail](mailto:contact@sv443.net?subject=Questions%20about%20contributing%20to%20JokeAPI)

<!-- So the anchors work better -->
<br><br><br><br><br><br><br><br><br>
