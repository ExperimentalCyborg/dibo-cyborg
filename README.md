# Dibo

Dibo is a simple Discord bot template based on Discord.js. It lets you build a custom discord bot without having to worry about the boring stuff.
All you have to do is put your bot token in `settings.json` and create your own .js files for custom commands and tasks. Examples and a tutorial are included in the source code.

Dibo also offers many useful utility functions for common tasks. Have a look in `./libs/tools.js`!

## Requirements:
1. Node.js: https://nodejs.org/
2. A Discord bot token, which you can create here: https://discord.com/developers/applications

Having basic knowledge of javascript and promises is useful, since you'll be writing your own custom commands and event handlers in javascript. 

Since dibo heavily relies on Discord.js, it's probably a good idea to read the [Discord.js documentation](https://discord.js.org/#/docs/). If you're new to Javascript and/or Discord in general, you might want to check out the [Discord.js guide](https://discordjs.guide/).

## Usage
Open a console window in the dibo root folder. Before you start the bot for the first time, run `npm install` to install the dependencies, Discord.js and sqlite3. Then run the bot with the `node .` command, which will automatically run `index.js`. 

If you made a custom loader or renamed index.js, you need to specify the file name: `node your-file-name.js`.  

## Included boring stuff:
(A Discord server is called a guild in Discord's documentation, so that's what we'll call it here as well.)

- A command handler
- A help text system
- A simple privilege system (note that server admins can always run every command)
- A key-value database for guild settings and per-guild user data
- A logging system that can send guild specific log messages to a guild text-channel (guild log messages are hidden from the console unless debug mode is enabled)
- Utility functions for recognizing user ID's, user mentions, user tags, role mentions, role names, and #channel-names for use in command arguments
- In case the prefix is unknown or conflicting, you can always mention the bot instead of using a prefix  
- Automatic sharding

And more.

To get started, check out the `_tutorial.js` files in `./commands` and `./tasks/`. 

## License
[GNU GPLv3 ](https://choosealicense.com/licenses/gpl-3.0/)
