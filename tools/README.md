# JokeAPI - Tools
This folder contains various scripts that do various things.  
Here's a summary:

<br>

| File | Command | Description | Arguments |
| :-- | :-- | :-- | :-- |
| [add-joke.js](./add-joke.js) | `npm run add-joke` | An interactive CLI prompt that adds a joke | - |
| [add-token.js](./add-token.js) | `npm run add-token [amount]` | Generates an [API token](https://jokeapi.dev/#api-tokens) to be used to gain unlimited access to the API | `-nc` to disable auto-copy of token |
| [generate-changelog.js](./generate-changelog.js) | `npm run changelog` | Turns the [`changelog.txt`](../changelog.txt) file into a markdown file ([`changelog.md`](../changelog.md)) | - |
| [ip-info.js](./ip-info.js) | `npm run ip-info` | Starts a server on `127.0.0.1:8074` that just returns information about each request's IP | - |
| [reassign-ids.js](./reassign-ids.js) | `npm run reassign-ids` | Goes through each joke file and reassigns IDs to each one, consecutively | - |
| [reformat.js](./reformat.js) | `npm run reformat` | Used to migrate old joke file formats to the latest one | - |
| [stresstest.js](./stresstest.js) | `npm run stresstest` | Sends lots of requests to JokeAPI (has to run in another process) to stresstest it | - |
| [submissions.js](./submissions.js) | `npm run submissions` | An interactive CLI prompt that goes through all joke submissions, prompting to add them | - |
| [test.js](./test.js) | `npm test` | Goes through all unit test scripts of the [`../tests`](../tests#readme) folder | - |
| [validate-ids.js](./validate-ids.js) | `npm run validate-ids` | Goes through each joke file and makes sure the IDs are correct (no duplicates or skipped IDs & correct order) | - |
| [validate-jokes.js](./validate-jokes.js) | `npm run validate-jokes` | Goes through each joke file and checks the validity of each joke and whether they can all be loaded to memory | - |

<br><br>

## How arguments work:

When using `npm run`, to provide minus-prefixed arguments, you need to separate npm-specific and command-specific arguments.  
To do this, add `--` like in this example:
```
npm run add-token -- -nc
```
