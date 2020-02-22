# Before submitting your contribution, please read the following
## If not, I might have to deny your contribution and I don't want to do that
1. Read [the Code_of_Conduct.md file](./Code_of_Conduct.md)
2. Install all dependencies with these two commands: `npm i` and `npm i --save-dev`
3. Run the script `npm run all` which will run these three commands:
    - `npm run validate-jokes` to make sure all jokes are formatted correctly
    - `npm run validate-ids` to verify that all jokes have the correct ID
    - `npm run lint` to check the code for any warnings or errors
4. Run JokeAPI locally by running the command `node JokeAPI`, request some jokes and test the areas you modified / added to make sure everything still works
5. Make sure all your changes are in a separate branch (not in the master branch)
6. Add yourself to the `contributors` object in the file `package.json` :)
    - **If it doesn't exist or is empty** please add it using the second format on [this website](https://flaviocopes.com/package-json/#contributors)
7. Submit a pull request on your forked repository, selecting `Sv443/JokeAPI` as the base repo and `master` as the base branch and select `YourUsername/JokeAPI` as the head repo and `YourBranch` as the compare branch
    - If your pull request is not ready to be merged yet, you can add `[WIP]` to the beginning of the title which will tell the repo maintainer(s) not to merge it yet.
8. Request a review from me (Sv443)
9. Check if the CI script and other checks for your pull request were successful (they can be found below the comments)
    - **If they were unsuccessful:** view the log, fix the errors, commit the code and push to the same branch. This will automatically update your pull request and re-run the checks
10. Once the pull request is approved and merged, delete the source branch  
  
<br><br>

### Other nice-to-know stuff:
- If you are working on the documentation, I recommend using [Visual Studio Code](https://code.visualstudio.com/) with the extension `fabiospampinato.vscode-highlight` - it will make the raw documentation a bit easier to read and work with.  
- If you want to generate a dependency graph, you need to install [Graphviz](https://graphviz.gitlab.io/download/) and add the path to the `bin` folder to your `%PATH%` environment vaiable. Then, run `npm run dependency-graph` and open the file `dev/dependency-graph.html` in a browser.  
- If you need to add an authorization token, you can generate one or multiple tokens with the command `npm run add-token [amount]`. If you omit the "amount" parameter, the script will generate a single token. After you run the command, the tokens will be listed in the console and you can now (after restarting JokeAPI) use these to gain unlimited access to JokeAPI.  

## If you need any help, please feel free to contact me with one of the methods listed on [my homepage](https://sv443.net/)
