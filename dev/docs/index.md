# JokeAPI - Developer Documentation [WIP]
This is a documentation on the internals of JokeAPI.  
The following files will teach you about how every aspect works:

- [Knowledge Prerequisites](#knowledge-prerequisites#readme)
- [Execution Flow](./execution-flow.md#readme)
- [Docs Compilation](./docs-compilation.md#readme)


<br><br><br>
<!-- #MARKER knowledge prerequisites -->

## Knowledge Prerequisites:
These are the requirements you need to know in order to understand or work with JokeAPI's code.

<br>

### Required:
You are **required** to know these things.
- Node.js
    - Native modules
        - path   (especially resolve() and join())
        - stream (how to create and pipe streams)
        - fs     (reading, writing files, creating Read- and WriteStreams)
        - http   (request methods, accepting and parsing requests, piping Read- and WriteStreams to the client)
    - Promise API (including Promise.all() construction through arrays)
- HTTP
    - Reverse proxies (proxy headers like "X-Forwarded-For")
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

EOF, please see the other files at the top.
