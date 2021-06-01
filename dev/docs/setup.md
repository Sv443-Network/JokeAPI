[<< Home](./home.md#readme)

# JokeAPI - How to set it up
This file will guide you through setting up an instance of JokeAPI.  
Please make sure you have the required knowledge and technical prerequisites - they can be found [here.](./home.md#readme)  
  
If you need help during setup, feel free to reach out to me [on Discord.](https://dc.sv443.net)

<br>

### Table of Contents:
- [Setup Guide](#setup-guide)
- [Unit Tests](#unit-tests)

<br><br>

## Setup Guide:
1. Open a terminal window in the project root directory (where the `package.json` file is).
2. Run the command `npm i` to install all dependencies.
3. Edit the file `.env.template`, filling it out with your values (`notepad .env.template` on Windows or `nano .env.template` on *nix).
4. Rename the file `.env.template` to just ".env" - VS Code should now hide this file.
5. Customize values in the `settings.js` file (optional).
6. Make sure the server's port (defined in `settings.httpServer.port` - default 8076) is being forwarded or proxied correctly so that HTTP requests can reach JokeAPI.
7. Create a `jokeapi` database on the SQL server defined in the `.env` file. It is required for joke caching and analytics.
8. Run the [unit tests](#unit-tests) to make sure everything works as it should - correct mistakes if there are any-
9. Use `npm start` or `node JokeAPI` to start JokeAPI.
    - If you need JokeAPI to continuously run in the background and reboot on any potential crash, I recommend using [the process manager `pm2`.](https://npmjs.com/package/pm2)  
    JokeAPI has a pm2 monitor integration, which can be accessed with the command `pm2 monit`

<br>


<br><br>

## Unit Tests:
JokeAPI has a few unit tests. These test JokeAPI's features, ensuring everything works as it should.  
  
To run these tests:  
1. Run JokeAPI in a separate process / terminal window.  
2. Run the tests with the command `npm test` or `node tools/test`  
    - If you are colorblind, use `npm run test-colorblind` or `node tools/test --colorblind` instead.  

<br>

**Note:**  
The unit tests expect JokeAPI to run on the same machine, accessible by `127.0.0.1` (localhost).


<br><br><br><br>

[<< Home](./home.md#readme)
