# Before submitting your contribution:
1. Read [the CODE_OF_CONDUCT.md file](./CODE_OF_CONDUCT.md)
2. Install all dependencies with these two commands: `npm i --save` and `npm i --save-dev`
3. Run the following scripts:
    - `npm run lint` to make sure your code doesn't contain any errors or warnings - if there are any, please fix them
    - `npm run reassign-ids` to ensure that all jokes have the correct IDs
4. Run JokeAPI locally with the batch file or with the command `node JokeAPI` and request some jokes to make sure everything still works
5. Make sure all your changes are in a separate branch (not in the master branch)
6. Submit a pull request on your forked repository, selecting `Sv443/JokeAPI` as the base repo and `master` as the base branch and select `YourUsername/JokeAPI` as the head repo and `YourBranch` as the compare branch
7. Request a review from me (Sv443) and await further instructions or an approved and merged pull request
8. Once the pull request is approved and merged, you can delete the source branch if you want to