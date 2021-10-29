# JokeAPI CLI tools
Since v2.3.2, JokeAPI has a globally callable command line binary, which acts as an interface to all command-line tools inside this `./tools` folder.

<br>

## Setup:
To register the JokeAPI binary, run the command `npm run link`  
If you get an `EACCES` error, try using `sudo npm run link`, otherwise you probably need to reinstall Node.js through a version manager like [nvm](https://github.com/nvm-sh/nvm)  
  
Afterwards, the binary will be globally callable with the commands `jokeapi` and `japi`  
  
To display a list of all commands, run `jokeapi -h`  
To get command-specific help and show the command's arguments, run `jokeapi -h <command>`

<br>

## Commands:
| Command | Description |
| :-- | :-- |
| `jokeapi start` | Starts JokeAPI (equivalent to running `npm start` or `node .`) |
| `jokeapi info` | Prints information about JokeAPI, like the /info endpoint |
