# JokeAPI Changelog (Version 2.3.1)

<br><br><br>

## [Planned for future releases]
- Allow definition of max requests per minute per each client ([issue #37](https://github.com/Sv443/JokeAPI/issues/37))
- Add positive flags and a "?whitelistFlags" param ([issue #127](https://github.com/Sv443/JokeAPI/issues/127))
- Add Unit Tests ([issue #121](https://github.com/Sv443/JokeAPI/issues/121))
- Serve docs with nginx to speed up page load times ([issue #118](https://github.com/Sv443/JokeAPI/issues/118))


<br><br><br>

## [CURRENT: 2.3.1] - The Safe Mode Hotfix, because bugs exist for some reason ([pull request #214](https://github.com/Sv443/JokeAPI/pull/214))
- Fixed bug "API Error 500 - Cannot read property 'msBeforeNext' of null" ([issue #212](https://github.com/Sv443/JokeAPI/issues/212))
- Fixed bug where API responded with Error 106 when using format=txt on endpoint /joke ([issue #218](https://github.com/Sv443/JokeAPI/issues/218))
- Re-flagged joke 79 ([issue #220](https://github.com/Sv443/JokeAPI/issues/220))
- API now automatically adds modification date <meta> tag to the docs ([issue #223](https://github.com/Sv443/JokeAPI/issues/223))
- /info endpoint now gives the number of safe jokes per language ([issue #224](https://github.com/Sv443/JokeAPI/issues/224))
- Added dependent jonathanbossenger/devdadjokes ([issue #225](https://github.com/Sv443/JokeAPI/issues/225))
- Added translations to joke submission parser
- Made static content not indexable by web crawlers


<br><br><br>

## [2.3.0] - The Safe Mode Update
- JokeAPI now has its own domain - https://jokeapi.dev/
    - Version 2 of the API should be called @ https://v2.jokeapi.dev/ but can also be called with the old domain and https://jokeapi.dev/
    - The stage version is @ https://stage.jokeapi.dev/
    - Version 3 will be available @ https://v3.jokeapi.dev/
- Implemented safe mode ([issue #196](https://github.com/Sv443/JokeAPI/issues/196))
- Added contributors to the documentation
- Added the blacklist flag "explicit" to filter out jokes containing explicit language
- Improved the documentation a little bit again
    - Small sub-headers can now be linked to, too
- Added some unit tests to make JokeAPI more reliable
    - Endpoint "/info"
    - Endpoint "/langcode/{LANGUAGE}"
    - Parameter "safe-mode" on Endpoint "/joke/{CATEGORY}"
- Added a URL parameter to dry-run the /submit endpoint ([issue #187](https://github.com/Sv443/JokeAPI/issues/187))
- API now tells clients how many requests they have left by providing some headers ([issue #188](https://github.com/Sv443/JokeAPI/issues/188))
- Added changelog generation in Markdown format (thanks to Sahithyan Kandathasan / [issue #191](https://github.com/Sv443/JokeAPI/issues/191))
- Changelog link in docs now redirects to the markdown file on GitHub ([issue #192](https://github.com/Sv443/JokeAPI/issues/192))
- Added a few category aliases
    - Miscellaneous for Misc
    - Coding for Programming
    - Development for Programming
    - Halloween for Spooky
- Renamed category "Miscellaneous" to "Misc" but kept old name "Miscellaneous" as an alias
- Added two new wrapper libraries
    - sv443-joke-api for Node.js / TS ([issue #190](https://github.com/Sv443/JokeAPI/issues/190))
    - jokeapi-go for Golang ([issue #193](https://github.com/Sv443/JokeAPI/issues/193))
- Updated C# code example in the docs ([issue #207](https://github.com/Sv443/JokeAPI/issues/207))
- Increased Rate Limiting budgets ([issue #208](https://github.com/Sv443/JokeAPI/issues/208))
    - When using GET: from 60 to 120
    - When using POST: from 3 to 5


<br><br><br>

## [2.2.2] - The Seasonal Update
- Added some new seasonal categories ([issue #180](https://github.com/Sv443/JokeAPI/issues/180))
    - Spooky (Halloween)
    - Christmas (thanks for the suggestion Dan)
- Added dependent ToastIT-dev/PoshBot.Joker ([issue #173](https://github.com/Sv443/JokeAPI/issues/173))
- Added a bunch of joke submissions
- Reliability improvements in the documentation ([issue #181](https://github.com/Sv443/JokeAPI/issues/181))
- Added POST as a method to submit data to the API since it makes more sense than PUT (maybe deprecating that some time)


<br><br><br>

## [2.2.1] - Version 2.2 Hotfix
- Added the Czech translation ([pull request #137](https://github.com/Sv443/JokeAPI/pull/137)) - provided by @ThatCopy (https://github.com/ThatCopy) - thanks :)
- Added a missing conversion mapping when using format `txt` and the `amount` parameter on endpoint `/joke` ([issue #138](https://github.com/Sv443/JokeAPI/issues/138))
- Fixed wrong URLs in the documentation's JavaScript
- Fixed crash when a client asks for a translation that doesn't exist
- Slightly improved the documentation
- Applied a few security patches


<br><br><br>

## [2.2.0] - The Pun Update
- Added joke category "Pun" ([issue #105](https://github.com/Sv443/JokeAPI/issues/105))
- Added "?amount" parameter to joke endpoint so multiple jokes can be fetched at once ([issue #126](https://github.com/Sv443/JokeAPI/issues/126))
- Added support for jokes and error messages of different languages ([issue #75](https://github.com/Sv443/JokeAPI/issues/75))
    - /langcode/{LANGUAGE} endpoint
    - /languages endpoint
    - "?lang=code" URL parameter
- Fixed ID caching (again, sigh) ([issue #80](https://github.com/Sv443/JokeAPI/issues/80))
- Added pm2 custom metrics ([issue #91](https://github.com/Sv443/JokeAPI/issues/91))
- Fixed HTTP 403 errors ([issue #96](https://github.com/Sv443/JokeAPI/issues/96))
- Remade the URL parser using a package ([issue #97](https://github.com/Sv443/JokeAPI/issues/97))
- Daemonized the API token refreshing ([issue #102](https://github.com/Sv443/JokeAPI/issues/102))
- Rate limiting joke submissions more harshly now ([issue #104](https://github.com/Sv443/JokeAPI/issues/104))
- Fixed error where the end of the payload were cut off, thus invalidating JSON ([issue #119](https://github.com/Sv443/JokeAPI/issues/119))
- Joke submission property order is now enforced, improving uniformity ([issue #120](https://github.com/Sv443/JokeAPI/issues/120))
- Joke submissions are now validated to make sure they don't contain fancy Unicode chars ([issue #123](https://github.com/Sv443/JokeAPI/issues/123))


<br><br><br>

## [2.1.5] - 2020 Q3 general patch #2
- Ditched my botched rate limiting package for a "commercial" one ([issue #113](https://github.com/Sv443/JokeAPI/issues/113))
- Added API token section to documentation ([issue #114](https://github.com/Sv443/JokeAPI/issues/114))
- Client now receives a "Token-Valid" header with the value 0 or 1 depending on token validity ([issue #115](https://github.com/Sv443/JokeAPI/issues/115))
- Renamed "X-Auth-Token" header to "Authorization" so requests don't get blocked by Cloudflare ([issue #117](https://github.com/Sv443/JokeAPI/issues/117))
- Cleaned up a lot of code


<br><br><br>

## [2.1.4] - 2020 Q3 general patch #1
- Fixed the IP getter module for like the 500th time now


<br><br><br>

## [2.1.3] - 2020 Q2 general patch #1
- Added option to disable all console output but error messages ([issue #72](https://github.com/Sv443/JokeAPI/issues/72))
- The content of jokes in the joke submission form is now correctly escaped and can no longer mess up the page ([issue #68](https://github.com/Sv443/JokeAPI/issues/68))
- Fixed crash when parsing a malformatted URI ([issue #69](https://github.com/Sv443/JokeAPI/issues/69) (nice))
- Re-flagged some jokes
- Updated dependencies


<br><br><br>

## [2.1.2] - Plain Text update
- Added file format "txt" to receive data as plain text
- Fixed the joke submission URL in the /info endpoint data
- Added HTTP error codes:
    - 413 Payload Too Large
    - 414 URI Too Long


<br><br><br>

## [2.1.1] - Auth update hotfix
- Fixed incorrect error cause when using an out-of-range ID range parameter (see [issue #54](https://github.com/Sv443/JokeAPI/issues/54))
- Added submission form (https://v2.jokeapi.dev/#submit)


<br><br><br>

## [2.1.0] - The auth update
- Added an authorization header to make whitelisting possible without needing to have a static IP
    - Added the script "npm run add-token [amount]" to add one or more tokens
- Improved the documentation (see [issue #52](https://github.com/Sv443/JokeAPI/issues/52))
- Fixed a few bugs in the documentation


<br><br><br>

## [2.0.1] - A few hotfixes for the big 2.0.0 updates and some very very minor features I wanted to add
- Hotfixed a few bugs from the big 2.0.0 update
- Fixed joke ID caching (to not serve the same jokes multiple times)
- Added three new commands that are run through CI and before contributing
- Enabled automated code fixing with ESLint


<br><br><br>

## [2.0.0] - The complete rewrite - JokeAPI was completely rewritten and should now run like 100x better and be more easy to develop and maintain
- Massively improved the "Try it out" section in the docs
- Reformatted the jokes to always contain all flags
- Added support for selecting multiple categories at once (for example: "https://v2.jokeapi.dev/joke/Dark,Miscellaneous/")
- Massive performance improvements:
    - The documentation page and some static content are now able to be served with gzip, deflate and brotli encoding, decreasing the required bandwidth and speeding up page loading time
    - Reformatted the jokes to have the IDs beforehand, furthermore increasing performance and making it easier to know which joke ID belongs to which joke
    - Now the documentation page runs on a daemon, meaning it will only be recompiled if a file has changed, massively improving JokeAPIs perfomance
    - Static content like the stylesheet, client-side JS and images will now be loaded separately, through the "static" endpoint, decreasing page load time by an order of magnitude
- Added a few new URL parameters:
    - Added the "?type" URL parameter to specify the type of the served joke ("single" or "twopart")
    - Added the "?contains" URL parameter to only serve jokes that match the provided search query
    - Added the "?idRange" URL parameter to get jokes from a single ID or an ID range (example: "https://v2.jokeapi.dev/joke/Any?id=50-75" or "...?id=15")
- Added the "racist" and "sexist" flags for better filtering of offensive jokes
- IP addresses are now hashed, protecting JokeAPI's users better and making it GDPR/DSGVO compliant
- Added multiple scripts that should be run before contributing to the project / that are run through GitHub's Continuous Integration:
    - "npm run reformat" to reformat jokes from the old pre-2.0.0 syntax to the new 2.0.0 syntax
    - "npm run reassign-ids" to make sure all jokes have the correct IDs
    - "npm run validate-jokes" to make sure all jokes are in the correct format
    - "npm run add-joke" to add a joke
- Renamed "category" endpoint to "joke"
- The submission of empty jokes will now be prevented
- Set up a new reverse proxy at "https://sv443.net/jokeapi/v2/" to let people slowly migrate to the new version
- Re-validated all jokes and removed duplicates and re-flagged them
- Added an analytics module that keeps track of everything and makes it possible for me to finally see some (anonymous) usage statistics (complies with the GDPR/DSGVO)
- Joke IDs will now be cached to prevent the same joke from being served multiple times in a row (this is not perfect yet but much better than before)
- The documentation page was completely rewritten and should now be easier to use and more concise
- Updated dependencies and added some new ones
- Updated the contributor guide (contributing.md file)


<br><br><br>

## [1.1.2]
oke categories are now case insensitive
railing slashes now don't produce an "invalid category" error anymore


<br><br><br>

## [1.1.1]
etter IP getter for the rate limiting
pdated dependencies
ery small improvements to the console window


<br><br><br>

## [1.1.0]
- switched to ReadStreams instead of just loading the entire file to RAM to massively improve request performance (more details in [issue #2](https://github.com/Sv443/JokeAPI/issues/2))
    - this basically means it transmits the data over time, instead of loading it all to RAM and sending it at once
dded rate limiting to counter DoS attacks (yes I've been getting some of those *sigh*)


<br><br><br>

## [1.0.0]
- turned the single endpoint into multiple endpoints
    - "categories" to get all available categories
    - "info" to get all information about JokeAPI
    - "category/XY" to get a joke
- added flag filter to blacklist certain jokes
- added very sophisticated analytics
- added "Allow" header to all incoming requests to better support preflight requests
- added multiple file format support
    - JSON
    - XML
    - YAML
- added JS and CSS injection into docs page to separate everything into three files (can be expanded to more files if needed)
- fixed minor style glitches on the docs page
- made the HTML and CSS of the docs way better
    - "scroll to top" button
        - smooth scroll
    - anchors to make linking to a certain header possible
    - turned "add joke" link into a button and moved it next to "scroll to top" button
    - fixed @import's
    - updated <meta>'s
    - turned "blank_" into "_blank" (sigh)
- added flag filter to interactive example
- did even more internal detail work
    - reformatted log files
    - clearing certain log files after a threshold is reached
- updated dependencies
- made better and more uniformly formatted error messages
- added this changelog


<br><br><br>

## [0.1.2]
- added "Dark" category
- added joke submission form
- improved interactive example
- modified gitignore


<br><br><br>

## [0.1.1]
- added interactive example on docs page
- made icon on docs page smaller
- added wrapper script


<br><br><br>

## [0.1.0]
- basic functionality
    - 47 jokes
    - category filter

<br><br><br>

This file was auto-generated from the source file at [./changelog.txt](./changelog.txt)