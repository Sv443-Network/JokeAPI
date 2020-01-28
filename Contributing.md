# Before submitting your contribution, please read the following:
## If not, I might have to deny your contribution and I don't want to do that
1. Read [the Code_of_Conduct.md file](./Code_of_Conduct.md)
2. Install all dependencies with these two commands: `npm i --save` and `npm i --save-dev`
3. Run the following scripts:
    - `npm run lint` to make sure your code doesn't contain any errors or warnings - if there are any, please fix them
    - `npm run reassign-ids` to ensure that all jokes have the correct IDs
4. Run JokeAPI locally with the batch file or with the command `node JokeAPI`, request some jokes and test the areas you modified / added to make sure everything still works
5. Make sure all your changes are in a separate branch (not in the master branch)
6. Add yourself to the `contributors` object in the file `package.json` :)
    > If it doesn't exist or is empty, please add it (use the second style on [this website](https://flaviocopes.com/package-json/#contributors))
7. Submit a pull request on your forked repository, selecting `Sv443/JokeAPI` as the base repo and `master` as the base branch and select `YourUsername/JokeAPI` as the head repo and `YourBranch` as the compare branch
8. Request a review from me (Sv443)
9. Check if the CI script and checks for your pull request were successful
    > If they were unsuccessful, view the log, fix the errors and push to the same branch. This will automatically update your pull request and re-run the checks
10. Once the pull request is approved and merged, delete the source branch  
  
  
If you are working on the documentation, I recommend using [Visual Studio Code](https://code.visualstudio.com/) with the extension `fabiospampinato.vscode-highlight` - it will make the raw documentation a bit easier to read and work with.  

## If you need any help, please feel free to contact me with one of the methods listed on [my homepage](https://sv443.net/)
