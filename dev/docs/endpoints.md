[<< Home](./home.md#readme)
# JokeAPI - Endpoints
This file tells you everything about JokeAPI's endpoints.  
If you need an explanation of what an endpoint is, [this should help you.](https://rapidapi.com/blog/api-glossary/endpoint/)


## Table of Contents:
- [How JokeAPI's endpoints work](#how-jokeapis-endpoints-work)
- [Location and execution of endpoints](#location-and-execution-of-endpoints)
- [Types of Endpoints](#endpoint-types)
- [Endpoint List](#endpoint-list)
    - [Categories](#categories)
    - [Endpoints](#endpoints)
    - [Flags](#flags)
    - [Formats](#formats)
    - [Info](#info)
    - [Joke](#joke)
    - [LangCode](#langcode)
    - [Languages](#languages)
    - [Ping](#ping)
    - [Submit](#submit)
    - [Clear Joke Cache](#clear-joke-cache)

<br><br><br>
<!-- #MARKER How endpoints work -->

## How JokeAPI's endpoints work:
JokeAPI's endpoints each have an underlying script that provides information about endpoints and a function to be executed on each request.  
You can find more info on the `call()` function in this section: [Location and execution of endpoints.](#location-and-execution-of-endpoints)

<br><br><br>
<!-- #MARKER Location and Execution -->

## Location and execution of endpoints:
### Location:
Endpoints are located in the folder defined in `settings.endpoints.get.dirPath` (by default `./endpoints/`).

<br>

### Execution:
On each request, JokeAPI goes through the endpoints folder, removes the `.js` file extensions and checks if the client's URL matches one of the endpoints.  
On this endpoint, the `call()` function is now called.  
This function gets passed a lot of parameters, which are essential in parsing and responding to a client request:
- `req` - Full client request object (contains all properties of the sent request)
- `res` - The client response (used to finalize the request and send a response)
- `url` - An array of strings describing the requested URL
- `params` - An object containing all query parameters (`?foo=bar&baz=xyz`)
- `format` - The requested file format (xml, yaml, txt, json)


<br><br><br>
<!-- #MARKER Endpoint Types -->

## Endpoint Types:
### Normal:
[WIP]
### Filter Component:
[WIP]

<br><br><br>
<!-- #MARKER Endpoint List -->

## Endpoint List:
This is a list of all of JokeAPI's endpoints.  
Additionally to all the information you see here, JokeAPI will *always* include a `timestamp` and an `error` property.

<br><br>

> ### Categories
> - URL: `/categories/`
> - Method: `GET`
> - Parameters: `format`, `lang`
>   
> This endpoint returns a list of all joke categories and [category aliases.](./home.md#category-aliases)  
>   
> The list of categories is formed by concatenating `settings.jokes.possible.anyCategoryName` and `settings.jokes.possible.categories` into an array.  
> The aliases are pulled from `settings.jokes.possible.categoryAliases`

<br><br>

> ### Endpoints
> - URL: `/endpoints/`
> - Method: `GET`
> - Parameters: `format`
>   
> This endpoint returns a list of all endpoints (such endpoint).  
> The returned list of endpoints is basically just a list of the endpoint's `meta` object export.  
>   
> Note that `/static/`, while technically being an endpoint, is excluded from this list due to it being intended for internal usage.  
>   
> Also note that as of `v2.4.0`, the `lang` parameter is not yet supported.  
> This is due to the static nature of the `meta` object. [Issue #243](https://github.com/Sv443/JokeAPI/issues/243) will fix this.  
>   
> The list of endpoints is created by iterating through every file inside `settings.endpoints.get.dirPath`  
> If a file ends with `.js`, the `meta` object is extracted and appended to the list of endpoints which is eventually returned to the client.

<br><br>

> ### Flags
> - URL: `/flags/`
> - Method: `GET`
> - Parameters: `format`, `lang`
>   
> This endpoint returns a list of all blacklist flags and a description of what they stand for.  
>   
> The flags are pulled from `settings.jokes.possible.flags`

<br><br>

> ### Formats
> - URL: `/formats/`
> - Method: `GET`
> - Parameters: `format`, `lang`
>   
> This endpoint returns a list of all file formats.  
>   
> The formats are pulled from `settings.jokes.possible.formats`

<br><br>

> ### Info
> - URL: `/info/`
> - Method: `GET`
> - Parameters: `format`, `lang`
>   
> It acts as a central point for most of JokeAPI's information.  
> It also contains some values that already have a dedicated endpoint.  
>   
> I'm too lazy to list where all values are pulled from, so please just look at the file yourself (after the line `responseText = convertFileFormat.auto(format, { `)

<br><br>

> ### Joke
> - URL: `/joke/{CATEGORY||ALIAS}`
> - Method: `GET`
> - Parameters: `safe-mode`, `format`, `blacklistFlags`, `type`, `contains`, `idRange`, `lang`, `amount`
>   
> Now this endpoint is a chonker.  
> The URL must contain a valid category name or [category alias](./home.md#category-aliases) (case insensitive).  
>   
> First, the `call()` function gets the client's IP address hash. It is used for [joke caching.](./joke-caching.md#readme)  
>   
> Then, an instance of the `FilteredJoke` class is created.  
> This class contains all jokes in every language (pulled from the object `allJokes` which is exported by the joke parser module after jokes have been parsed).  
> The `FilteredJoke` class also has a lot of methods, which are used to set all the different kinds of filters.  
> These are the filters that can be set:  
> - Joke category (through the URL path)
> - Joke and response language (through the URL parameter `lang`)
> - Safe mode (through the value-less URL parameter `safe-mode`)
> - Joke type (through the URL parameter `type`)
> - Contains (through the URL parameter `contains`)
> - ID range (through the URL parameter `idRange`)
> - Blacklist flags (through the URL parameter `blacklistFlags`)
> - Amount of jokes (through the URL parameter `amount`)
>   
> After calling the appropriate methods to set these filters, the `getJokes()` method is called.  
> This method in turn calls the private method `_applyFilters()`.  
>   
> `_applyFilters()` goes through each joke, checks if it matches the previously set filters, and if it doesn't, excludes the joke from the pool of filtered jokes.  
>   
> After this method is done, `getJokes()` chooses `n` amount of random jokes from the pool of filtered jokes.  
> `n` is defined by the `amount` parameter.  
> If set to nothing or a value below `0`, it defaults to `1`.  
> If set to a value above the maximum amount (defined in `settings.jokes.maxAmount` - usually 10), the value of `settings.jokes.maxAmount` is used.

<br><br>

> ### LangCode
> - URL: `/langcode/{LANGUAGE_NAME}`
> - Method: `GET`
> - Parameters: `format`, `lang`
>   
> This endpoint is used to get the two character [ISO 639-1 / Alpha-2](https://en.wikipedia.org/wiki/ISO_639-1) language code.  
> The name of the language has to be provided in the URL path.  
>   
> To find out the language code, the function `languageToCode()` of the `languages` module is used.  
> This function uses the library [Fuse.js](https://fusejs.io/) to fuzzily search for a matching language.  
> The list of supported languages can be found in `settings.languages.langFilePath`  
> Fuzzy means that provided language doesn't have to be an exact match, it just has to be vaguely correct.  
> Example: `egl1sh` would still be recognized as `English`, yielding the language code `en`

<br><br>

> ### Languages
> - URL: `/languages/`
> - Method: `GET`
> - Parameters: `format`, `lang`
>   
> This endpoint returns a list of all joke and system languages and a list of all possible language codes.  
> It also returns the default language code (defined in `settings.languages.defaultLanguage` - usually `en`).  
>   
> The list of joke languages is gotten from the `jokeLangs()` function of the `languages` module.  
> This function iterates over all files in the folder defined by `settings.jokes.jokesFolderPath`.  
> Excluded are files that match the name of the template (defined by `settings.jokes.jokesTemplateFile`).  
>   
> The list of system languages is created in the `translate` module, when JokeAPI is started up.  
> The `systemLangs()` function of the `languages` module just passes through the call to the function `systemLangs()` of the `translate` module.  
>   
> The list of all possible language codes is created from the file defined by `settings.languages.langFilePath`

<br><br>

> ### Ping
> - URL: `/ping/`
> - Method: `GET`
> - Parameters: `format`, `lang`
>   
> This endpoint was created as an inexpensive way to test if JokeAPI is online.  
> It's inexpensive because the returned data is very small (especially with `format=txt`) and the only real calculation done is file format conversion and translation.

<br><br>

> ### Static
> - URL: `/static/{FILE_NAME}`
> - Method: `GET`
> - Parameters: none
>   
> This endpoint is special. It is not listed on the `/endpoints/` endpoint and is mainly used by JokeAPI's documentation.  
> It serves static content, which, contrary to the semi-dynamic documentation, isn't modified by JokeAPI.  
>   
> Inside the endpoint file, you'll find a `switch(requestedFile)` statement.  
> It is used to ensure that the requested file exists and it also allows applying special properties to each static file.  
> These are the properties that can be modified:  
> - `filePath` - The path to the file
> - `mimeType` - The [MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) of the file
> - `statusCode` - The [HTTP status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) to respond with - usually `200` (Ok)
> - `allowEncoding` - Whether or not this file should be served encoded
> - `allowRobotIndexing` - Whether or not to allow robots / web crawlers like [Googlebot](https://developers.google.com/search/docs/advanced/crawling/googlebot) to index this file
>   
> Note that static file encoding is not currently implemented with the exception of the files that are inside the folder `settings.documentation.compiledPath`  
>   
> The `meta` export of this endpoint is also special as it has these unique boolean properties:  
> - `unlisted` - Makes the `/endpoints/` endpoint ignore this endpoint
> - `noLog` - Prohibits the `logRequest` module from writing analytics data and from sending a console message
> - `skipRateLimitCheck` - Prevents the [rate limiting](./rate-limiting.md#readme) from being incremented


<br><br>

> ### Clear Joke Cache
> - URL: `/clearJokeCache/`
> - Method: `POST`
> - Parameters: `format`, `lang`
>   
> TODO:



<br><br><br><br>

[<< Home](./home.md#readme)
