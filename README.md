<div align="center" style="text-align:center">

# The code in this repo moved
What you see in this repo is very outdated code and is probably not going to run.  
The latest source code of JokeAPI now lives on my own Git server: https://git.sv443.net/sv443/JokeAPI-v2  
  
If you have any issues, please still use this repository on GitHub to submit them.  
For pull requests however, please use the new repo.  

</div>

<br><br><br><br><br><br>

<!-- unholy HTML -->
<div style="text-align: center;" align="center">
    <h1>
        <a href="#readme"><img src="https://sv443.net/cdn/jokeapi/icon_readme.png" width="120" height="120"></a><br>JokeAPI<br>
        <h3>
            &gt; <a href="https://jokeapi.dev/" rel="noopener noreferrer">Documentation</a> &bull; <a href="https://jokeapi.dev/#try-it" rel="noopener noreferrer">Try it out</a> &bull; <a href="./changelog.md" rel="noopener noreferrer">Changelog</a> &bull; <a href="https://dc.sv443.net/" rel="noopener noreferrer">Discord Server</a> &lt;
        </h3>
    </h1><br>

A free and open REST API that delivers consistently formatted jokes in JSON, XML, YAML, or plain text.  
Powerful filters allow you to get just the jokes you want - no sign-up needed. Comes with CORS support.  

<br>

[![API uptime the last 7 days](https://img.shields.io/uptimerobot/ratio/7/m784261094-bff76b959ebb8fc39f7eb2d0)](https://status.sv443.net/) [![Known vulnerabilities](https://snyk.io/test/github/Sv443-Network/JokeAPI/badge.svg)](https://snyk.io/test/github/Sv443-Network/JokeAPI) [![License on GitHub](https://img.shields.io/github/license/Sv443-Network/JokeAPI)](https://sv443.net/LICENSE)  
[![Join the Discord server](https://badgen.net/discord/online-members/aBH4uRG?icon=discord)](https://dc.sv443.net/) [![Open issueson GitHub](https://img.shields.io/github/issues/Sv443-Network/JokeAPI)](https://github.com/Sv443-Network/JokeAPI/issues) [![GitHub stargazers](https://img.shields.io/github/stars/Sv443-Network/JokeAPI?style=social)](https://github.com/Sv443-Network/JokeAPI/stargazers)

</div>

<br>

> [!WARNING]  
> JokeAPI contains a very wide variety of jokes, some of which can be seen as quite offensive.  
> They can be reliably filtered out using the parameters [`?blacklistFlags`](https://jokeapi.dev/#flags-param) and [`?safe-mode`](https://jokeapi.dev/#safe-mode).  
> Still, use this API at your own risk!

> [!NOTE]  
> JokeAPI is free to use, so it relies on donations to cover the costs.  
> If you enjoy using it, [please consider supporting the development ❤️](https://github.com/sponsors/Sv443)

> [!NOTE]  
> If you want to contribute to JokeAPI (code, jokes or translations), please refer to the [contributing guide.](./.github/Contributing.md)  
> Also make sure to use the repo at https://git.sv443.net/sv443/JokeAPI-v2

<br>

## Community-made wrapper libraries:
-   <b><a href="https://github.com/DanBuxton/JokeAPI-CS-Wrapper#readme"><img src="./docs/static/external/csharp.svg" width="16" height="16" /> C#</a></b>
-   <b><a href="https://github.com/MichaelDark/jokeapi#readme"><img src="./docs/static/external/dart.svg" width="16" height="16" /> Dart</a></b>
-   <b><a href="https://github.com/Icelain/jokeapi#readme"><img src="./docs/static/external/golang.svg" width="16" height="16" /> Go</a></b>
-   <b><a href="https://github.com/the-codeboy/Jokes4J#readme"><img src="./docs/static/external/java.svg" width="16" height="16" /> Java (com.github.the-codeboy.Jokes4J)</a></b>
-   <b><a href="https://github.com/EasyG0ing1/JavaJokesAPI#readme"><img src="./docs/static/external/java.svg" width="16" height="16" /> Java (com.simtechdata.jokeapi)</a></b>
-   <b><a href="https://github.com/ethauvin/jokeapi#readme"><img src="./docs/static/external/kotlin.svg" width="16" height="16" /><img src="./docs/static/external/java.svg" width="16" height="16" /><img src="./docs/static/external/android.svg" width="16" height="16" /> Kotlin, Java & Android (net.thauvin.erik.jokeapi)</a></b>
-   <b><a href="https://github.com/khurozov/jokeapi-java#readme"><img src="./docs/static/external/java.svg" width="16" height="16" /> Java (uz.khurozov.jokeapi-java)</a></b>
-   <b><a href="https://github.com/sahithyandev/sv443-joke-api-js-wrapper#readme"><img src="./docs/static/external/nodejs.svg" width="16" height="16" /> Node.js</a></b>
-   <b><a href="https://github.com/IllusionMan1212/jokeapi-odin#readme"><img src="./docs/static/external/odin.svg" width="16" height="16" /> Odin</a></b>
-   <b><a href="https://github.com/JustPush-io/php-jokeapi#readme"><img src="./docs/static/external/php.svg" width="16" height="16" /> PHP</a></b>
-   <b><a href="https://github.com/thenamesweretakenalready/Sv443s-JokeAPI-Python-Wrapper#readme"><img src="./docs/static/external/python.svg" width="16" height="16" /> Python</a></b>
-   <b><a href="https://github.com/canarado/joketeller#readme"><img src="./docs/static/external/rust.svg" width="16" height="16" /> Rust</a></b>
-   <b><a href="https://github.com/bitstep-ie/jokeapi#readme"><img src="./docs/static/external/typescript.svg" width="16" height="16" /> TypeScript</a></b>

<br>

## Some projects that use JokeAPI:

| Project                                                                                                  | Author                                                     |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [dozens Advices](https://github.com/ZephyrVentum/dozens-Advices)                                         | [ZephyrVentum](https://github.com/ZephyrVentum)            |
| [Shadow](https://github.com/QGIsK/Shadow)                                                                | [QGIsK](https://github.com/QGIsK)                          |
| [Jokepy](https://github.com/aksty/Jokepy)                                                                | [aksty](https://github.com/aksty)                          |
| [Dark1](https://github.com/whiteadi/Dark1)                                                               | [whiteadi](https://github.com/whiteadi)                    |
| [Prejudice Networks](https://github.com/LiamTownsley/Prejudice-Networks)                                 | [Liam Townsley](https://github.com/LiamTownsley)           |
| [https://irshad.ml/humour.html](https://irshad.ml/humour.html)                                           | [draco-malfoy](https://github.com/draco-malfoy)            |
| [Random Joke Generator with Flutter](https://github.com/variousnabil/Random-Joke-Generator-with-Flutter) | [variousnabil](https://github.com/variousnabil)            |
| [comma](https://thatcopy.pw/comma)                                                                       | [ThatCopy](https://github.com/ThatCopy)                    |
| [Joke Teller](https://github.com/AlHood77/Joke_Teller)                                                   | [AlHood77](https://github.com/AlHood77)                    |
| [Jokes plugin for Craft CMS 3.x](https://github.com/remcoov/jokes)                                       | [remcoov](https://github.com/remcoov)                      |
| [PoshBot.Joker](https://github.com/ToastIT-dev/PoshBot.Joker)                                            | [ToastIT-dev](https://github.com/ToastIT-dev)              |
| [JokeAPI_ComputerCraft](https://github.com/Sv443-Network/JokeAPI_ComputerCraft)                                  | [Sv443](https://github.com/Sv443)                          |
| [Dev Dad Jokes](https://github.com/jonathanbossenger/devdadjokes)                                        | [Jonathan Bossenger](https://github.com/jonathanbossenger) |

<!--
Old list-style dependents:
- [dozens Advices](https://github.com/ZephyrVentum/dozens-Advices) by [ZephyrVentum](https://github.com/ZephyrVentum)
- [Shadow-bot](https://github.com/QGIsK/Shadow-bot) by [QGIsK](https://github.com/QGIsK)
- [Jokepy](https://github.com/aksty/Jokepy) by [aksty](https://github.com/aksty)
- [Dark1](https://github.com/whiteadi/Dark1) by [whiteadi](https://github.com/whiteadi)
- [Prejudice Networks](https://github.com/LiamTownsley/Prejudice-Networks) by [Liam Townsley](https://github.com/LiamTownsley)
- [https://irshad.ml/humour.html](https://irshad.ml/humour.html) by [draco-malfoy](https://github.com/draco-malfoy)
- [Random Joke Generator with Flutter](https://github.com/variousnabil/Random-Joke-Generator-with-Flutter) by [variousnabil](https://github.com/variousnabil)
- [comma](https://thatcopy.pw/comma) by [ThatCopy](https://github.com/ThatCopy)
- [Joke Teller](https://github.com/AlHood77/Joke_Teller) by [AlHood77](https://github.com/AlHood77)
- [Jokes plugin for Craft CMS 3.x](https://github.com/remcoov/jokes) by [remcoov](https://github.com/remcoov)
- [PoshBot.Joker](https://github.com/ToastIT-dev/PoshBot.Joker) by [ToastIT-dev](https://github.com/ToastIT-dev)
- [JokeAPI_ComputerCraft](https://github.com/Sv443-Network/JokeAPI_ComputerCraft) by [Sv443](https://github.com/Sv443)
-->

<br><br><br><br>

<div style="text-align: center;" align="center">

Made with ❤️ by [Sv443](https://github.com/Sv443) and [contributors](https://github.com/Sv443-Network/JokeAPI/graphs/contributors)  
Like JokeAPI? Please consider [supporting the development](https://github.com/sponsors/Sv443)

</div>
