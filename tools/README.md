[&lt; Back](../README.md#readme)

# JokeAPI CLI tools

Since v2.3.2, JokeAPI has a globally callable command line binary, which acts as an interface to all command-line tools inside this `./tools` folder.

<br>

## Setup:

To register the JokeAPI binary, run the command `npm run link`  
If you get an `EACCES` error, try using `sudo npm run link`, otherwise you probably need to reinstall Node.js through a version manager like [nvm](https://github.com/nvm-sh/nvm)

Afterwards, the binary will be globally callable with the commands `jokeapi` and `japi`

To display a list of all commands, run `jokeapi -h`  
To get command-specific help and <u>show the command's arguments</u>, run `jokeapi -h <command>`

<br>

## Commands:
| Command | Alias | Description |
| :-- | :-- | :-- |
| `japi start` | `run` | Starts JokeAPI (equivalent to running `npm start` or `node .`) |
| `japi info` | `i` | Prints information about JokeAPI, like the /info endpoint |
| `japi add-joke` | `j` | An interactive CLI prompt that adds a joke |
| `japi add-token` | `t` | Generates an [API token](https://jokeapi.dev/#api-tokens) to be used to gain unlimited access to the API |
| `japi generate-changelog` | `cl` | Turns the [`changelog.txt`](../changelog.txt) file into a markdown file ([`changelog.md`](../changelog.md)) |
| `japi ip-info` | `ip` | Starts a server on `127.0.0.1:8074` that just returns information about each request's IP |
| `japi reassign-ids` | `ri` | Goes through each joke file and reassigns IDs to each one, consecutively |
| `japi stresstest` | `str` | Sends lots of requests to JokeAPI (has to run in another process) to stresstest it |
| `japi submissions` | `s` | An interactive CLI prompt that goes through all joke submissions, prompting to add them |
| `japi test` | - | Goes through all unit test scripts of the [`../tests`](../tests#readme) folder |
| `japi validate-ids` | `vi` | Goes through each joke file and makes sure the IDs are correct (no duplicates or skipped IDs & correct order) |
| `japi validate-jokes` | `vj` | Goes through each joke file and checks the validity of each joke and whether they can all be loaded to memory |
