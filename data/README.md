# JokeAPI - Data
This folder contains a lot of various data related files, including jokes, joke submissions, translations and log files.  

<br>

## Folders:

| Folder | Description |
| :-- | :-- |
| [auth](./auth/) | Contains data related to authentication (like [API tokens](https://jokeapi.dev/#api-tokens)) |
| [jokes](./jokes/) | Contains all of JokeAPI's actual jokes. There's one file per language. |
| [lists](./lists/) | A few lists regarding IP blacklisting and whitelisting and hiding requests of certain IPs from the console. |
| [logs](./logs/) | This is where JokeAPI will dump its log files. Folder will be created on startup. |
| [sql](./sql/) | A few SQL files, which contain queries to create database tables. |
| [submissions](./submissions/) | This is where all joke submissions will be saved to (under a sub-folder, per each language). Folder will be created on startup. |
| [translations](./translations/) | This folder contains all of JokeAPI's *static* translations. [See translations readme.](./translations/README.md#readme) |

<br>

## Files:

| File | Description |
| :-- | :-- |
| [errorMessages.js](./errorMessages.js) | In here are all *dynamic* error messages, meaning they run code to generate themselves |
| [fileFormats.json](./fileFormats.json) | This file maps a few properties like MIME type to all file formats |
| [languages.json](./languages.json) | This is a list of all possible language codes and what language they belong to |
