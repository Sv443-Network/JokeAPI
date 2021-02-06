[<< Home](./home.md#readme)
# JokeAPI - Documentation Compilation [WIP]
The JokeAPI documentation is semi-static.  
It goes through a compilation process that is unique to JokeAPI.  
This file will teach you all about it.  
  
In the init phase, a [daemon](https://github.com/Sv443/SvCoreLib/blob/master/docs.md#folderdaemon) is started which supervises the directory the raw docs files are in.  
If it detects that a file has changed, the documentation is recompiled.  
This allows you to modify the docs while JokeAPI is running.  
Note that this process might take up to a few seconds.

<br>

## Stages:
There are two stages to the docs compilation.  
Each time JokeAPI starts up, these stages are executed (the docs get recompiled).  
  
In this startup phase, the compilation is executed without awaiting a callback.  
This means that requests that arrive immediately after startup might receive some errors or outdated files.  
This is usually fixed after no longer than a second.  
If JokeAPI doesn't run on an SSD, this compilation process might take several seconds.  
  
The docs are also recompiled when JokeAPI is already running, but the daemon detected that files have been changed.  
These are the stages of the docs (re)compilation:
1. [Constants Injection](#constants-injection)
2. [Encoding](#encoding)

<br><br><br>

# Constants Injection:
This is the first phase of the docs compilation.  
In this phase, the `docs.js` module goes through a list of constants.  
It scans through the **raw** documentation files, injecting the above mentioned constants at their predefined insertion markings.  
The result is a **compiled** version of the documentation files.  
  
The raw files are taken from `settings.documentation.rawDirPath` ("./docs/raw/" by default)  
The compiled files are put into `settings.documentation.compiledPath` ("./docs/compiled/" by default)  
These compiled files should **not** be modified as they are auto-created.  
  
The insertion markings are in one of these two formats:  
```html
<!--%#KEYWORD:CONSTANTNAME#%-->
```
or
```html
<%#KEYWORD:CONSTANTNAME#%>
```
`KEYWORD` can be either `INSERT`, if a single value should be inserted, or `INJECT` if an entire file's contents should be injected (though the functionality to inject entire files doesn't exist at this point).  
  
`CONSTANTNAME` is a predefined name, which can be set and assigned a value in the variable `injections` of the function `inject()` inside `./src/docs.js`  
Here you can add your own values or edit or delete existing ones.

<br><br><br>

# Encoding
The second phase takes the compiled documentation files that have already gone through [phase 1](#constants-injection) and creates three separate versions of them.  
The separate versions of the files are all encoded with a different algorithm.  
This encoding step is done preemptively so that it doesn't need to run each time a request comes in.  
  
The encoded files are taken from and put back into `settings.documentation.compiledPath` ("./docs/compiled/" by default)  
  
Encoding algorithms that JokeAPI supports:
| Efficiency | Name | Algorithm | File Extension |
| --- | --- | --- | --- |
| 3 | `brotli` / `br` | [Brotli](https://en.wikipedia.org/wiki/Brotli) | `.br` |
| 2 | `gzip` | [Gzip / Lempel-Ziv / LZ77](https://en.wikipedia.org/wiki/Gzip) | `.gz` |
| 1 | `deflate` | [Deflate](https://en.wikipedia.org/wiki/DEFLATE) | `.zz` |
| 0 | `identity` | None | - |

<br>

Higher efficiency = less latency / increased speed  
File extension = the file extension of the encoded files in `settings.documentation.compiledPath`

<br><br><br><br>

[<< Home](./home.md#readme)
