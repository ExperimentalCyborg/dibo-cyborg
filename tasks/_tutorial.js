const dibo = require('../libs/dibo');

// This tutorial is unfinished and unpolished. If it is confusing, feel free to
// ask questions or make suggestions on github or twitter.


/*
This file gets executed once, after the database and the commands are loaded,
but before the connection to discord is made.
For a load-time one-off function, just put your code here and remove everything below this.
*/


//A function that runs once, but waits until after we're connected to discord:
dibo.client.on('ready', async () => {
    // Because this runs as soon as the bot has connected to Discord, so you can take
    // full advantage of dibo.client, which is a Discordjs.Client object.
});


// You can attach a custom function to a discord event with the following code:
dibo.client.on('eventname', async (value1, value2) => {
    // What you put here runs whenever the event is triggered.
    // What value1 and/or value2 represent depends on the event.
    // for a list of events you can use, check the discord.js documentation of the Client object:
    // https://discord.js.org/#/docs/main/stable/class/Client
});

// For an explanation on using the database, check out the commands tutorial.

// todo: example of using an interval based task (kinda like a cronjob but within this thread)
