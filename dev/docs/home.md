# JokeAPI - Developer Documentation [WIP]
This documentation is up to date with version: `2.4.0`  
  
This is a documentation on the internals of JokeAPI.  
Use it to get to know how the API works and to learn about its quirks.  
The following topics will teach you about how every aspect works:

- Home
    - [Important Information](#important-information)
    - [Knowledge Prerequisites](#knowledge-prerequisites)
    - [Technical Prerequisites](#technical-prerequisites)
    - [Miscellaneous Concepts](#miscellaneous-concepts)
- Other Topics
    - [How to set up JokeAPI](./setup.md#readme)
    - [WIP - Execution Flow](./execution-flow.md#readme)
    - [WIP - Docs Compilation](./docs-compilation.md#readme)
    - [Endpoints](./endpoints.md#readme)
    - [WIP - File Format Conversion](./file-format-conversion.md#readme)
    - [WIP - Translations](./translations.md#readme)
    - [WIP - Rate Limiting](./rate-limiting.md#readme)
    - [WIP - Lists](./lists.md#readme)
    - [WIP - Joke Submissions](./joke-submissions.md#readme)
    - [WIP - Joke Caching](./joke-caching.md#readme)



<br><br><br>
<!-- #MARKER Important Info -->

## Important Information:
- Settings Notation
    > In this documentation you'll encounter a lot of values denoted like this: `settings.foo.bar`  
    > These values are defined at a central point for easy modification. You'll find them in the JSON-like `settings` object in the file [settings.js](../../settings.js) in the root directory of JokeAPI.  
    > The settings object can not be modified at runtime due to the usage of `Object.freeze()` - this prevents possible XSS-like exploits and just general inconsistencies.




<br><br><br>
<!-- #MARKER knowledge prerequisites -->

## Knowledge Prerequisites:
These are the requirements you need to know in order to understand or work with JokeAPI's code.

<br>

### Required:
You are **required** to know these things.
- JavaScript
    - Extensive knowledge of JS is required as a lot of very complex syntax is used
    - Promise API (including `Promise.all()`)
- Node.js
    - Native modules
        - path   (especially `resolve()` and `join()`)
        - stream (how to create and pipe streams)
        - fs     (reading, writing files, creating Read- and WriteStreams)
        - http   (request methods, accepting and parsing requests, piping Read- and WriteStreams to the client)
- HTTP
    - Using reverse proxies (especially proxy headers like "X-Forwarded-For")
    - Request methods
    - Response headers
    - Encoding
- JSON
    - Reading JSON files
    - Writing JSON files
    - Parsing JSON and ensuring correct format

<br>

### Optional:
These are **optional** requirements. It is helpful but not necessary to know them.
- SQL (simple syntax - SELECT, WHERE, INSERT INTO, ...)
- HTML / CSS / Web-JS (for modifying the docs)
- SvCoreLib (my own core library used extensively throughout the API. It's pretty well documented [here](https://github.com/Sv443/SvCoreLib/blob/master/docs.md#readme))



<br><br><br>
<!-- #MARKER technical prerequisites -->

## Technical Prerequisites:
These are the technical requirements you need to have in order to work with JokeAPI's code.

### Required:
You **need** these things for working on JokeAPI.
- Node.js v11.7.0 or newer (needed for the Brotli compression of the docs - otherwise set `settings.httpServer.encodings.brotli` to `false`)
- MySQL / MariaDB / MSSQL database with a UTF-8 collated database that has the name defined in `settings.sql.database` (usually `jokeapi`)

### Optional:
These things are **optional** but strongly recommended.
- Visual Studio Code with the following extensions (JokeAPI has custom support for them):
    - [`fabiospampinato.vscode-highlight`](https://marketplace.visualstudio.com/items?itemName=fabiospampinato.vscode-highlight)
    - [`coenraads.bracket-pair-colorizer-2`](https://marketplace.visualstudio.com/items?itemName=coenraads.bracket-pair-colorizer-2)



<br><br><br>
<!-- #MARKER Misc Concepts -->

## Miscellaneous Concepts:
### Category Aliases:
> Category aliases were introduced when I really started to dislike the category name `Miscellaneous`, which I changed to `Misc`.  
> In order not to break backwards compatibility though, `Miscellaneous` would have to still give the same jokes.  
> So I decided to kill two birds with one stone by implementing category aliases.  
> Internally, they are resolved to one of the primary categories.  
> Example: The category `Miscellaneous` will be automatically converted to `Misc` by JokeAPI and will be treated as if the client used `Misc` in the first place.



<br><br><br>

**EOF, please see the other files at the top.**
