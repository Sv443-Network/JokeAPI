[<< Home](./index.md#readme)
# JokeAPI - Code Execution Flow [WIP]
This file tells you about what modules JokeAPI executes and in what order and gives a short summary about the modules.

## Table of Contents:
1. [Startup](#startup)
    - [Module Initialization](#module-initialization)
        1. [Languages](#languages-module-initialization)
        2. [Translations](#translations-module-initialization)
        3. [Joke Parser](#joke-parser-module-initialization)
2. [Incoming Requests](#incoming-requests)
    1. [URL Parsing](#url-parsing)
    2. [IP Resolution](#ip-resolution)
    3. [Checking for API Token](#checking-for-api-token)
    4. [Checking Lists](#checking-lists)
    5. [Adding CORS Headers](#adding-cors-headers)
    6. [Update pm2 meter](#update-pm2-meter)
    - [GET Request](#get-request)
        - [Check for matching Endpoint](#check-for-matching-endpoint)
        - endpoint found
            1. [Call endpoint's .call() function](#call-endpoint)
            2. [Apply headers to prevent caching](#add-anti-caching-headers)
        - no endpoint found
            - [Serve Documentation](#serve-documentation)
    - [POST/PUT Request](#post-put-request)
        - data is a submission
            - [Parse Submission](#parse-submission)
        - data equals the restart token in `.env`
            - [Restart JokeAPI](#restart-jokeapi)
        - no data gotten after timeout
            - End with HTTP 400



<br><br><br><br>

[<< Home](./index.md#readme)
