# Before submitting your contribution, please read the following:
1. [Read the Code_of_Conduct.md file](./Code_of_Conduct.md) (TLDR: just behave in a friendly manner).
2. [Click here](https://github.com/Sv443/JokeAPI/fork) to fork the repository. Afterwards, clone or download it and locate the folder where it is contained.
3. Make the changes you want to make to the code.
4. Run the script `npm run all` which will run these three commands:
    - `npm run validate-jokes` to make sure all jokes are formatted correctly.
    - `npm run validate-ids` to verify that all jokes have the correct ID.
    - `npm run lint` to check the code for any warnings or errors.
5. Run JokeAPI locally by running the command `node JokeAPI`, request some jokes and test the areas you modified / added to make sure everything still works.
6. Add yourself to the `contributors` object in the `package.json` file :)
    <!-- - **If it doesn't exist or is empty** please add it using the second format on [this website](https://flaviocopes.com/package-json/#contributors) -->
7. Submit a pull request on your forked repository, selecting `Sv443/JokeAPI` as the base repo and `master` as the base branch and selecting `YourUsername/JokeAPI` as the head repo and `YourBranch` as the compare branch
    - If your pull request is not ready to be merged yet, you can add `[WIP]` to the beginning of the title which will tell the repo maintainer(s) and automated scripts not to merge it yet.
8. Request a review from me (Sv443).
9. Check if the CI script and other checks for your pull request were successful (they can be found below the comments).
    - **If they were unsuccessful:** view the log, fix the errors, commit the code and push to the same branch. This will automatically update your pull request and re-run the checks.
10. Once the pull request is approved and merged, you can delete the source branch and your forked repo if you want to.  
    - **If it isn't**, please read the comments from the reviewer(s) and make the necessary changes.
  
<br><br>

### Other nice-to-know stuff:
- I really recommend using [Visual Studio Code](https://code.visualstudio.com/) with the extension [`fabiospampinato.vscode-highlight`](https://marketplace.visualstudio.com/items?itemName=fabiospampinato.vscode-highlight) - it will add custom styling to the syntax highlighting in the editor and make the code easier to read and work with.  
- If you want to generate a dependency graph, you need to install [Graphviz](https://graphviz.gitlab.io/download/) and add the path to the `bin` folder to your `%PATH%` environment vaiable. Then, run the command `npm run dependency-graph` and open the file `./dev/dependency-graph.html` in a browser.  
- If you need to add an authorization token, you can generate one or multiple tokens with the command `npm run add-token [amount]`. If you omit the "amount" parameter, the script will generate a single token. After you run the command, the tokens will be listed in the console and you can now (after restarting JokeAPI) use it in the `x-api-token` header to gain unlimited access to JokeAPI.  

## If you need any help, please feel free to contact me through [Discord](https://sv443.net/discord) or [E-Mail](mailto:sven.fehler@web.de?subject=Questions%20about%20contributing%20to%20JokeAPI)
