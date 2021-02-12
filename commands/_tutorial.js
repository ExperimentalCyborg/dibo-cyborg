const dibo = require('../libs/dibo');

// This tutorial is unfinished and unpolished. If it is confusing, feel free to
// ask questions or make suggestions on github or twitter.

module.exports = { // This object is required for every command file. Without it, loading will fail.
    'names': [], // A list of command names. The first one is the "normal" name, extra ones will be aliases.
    'privilege': dibo.privilege.USER, // Who will be allowed to run this command. Everyone can run User commands, and Admins can always run every command.
    'summary': '', // A one line explanation of what the command does. Shows up in the commands list and at the top of the help text.
    'help': '', // A detailed explanation of the command. Can be multiple lines. %%p will be replaced with the command prefix. %%c will be replaced with the prefixed command.
    'func': async (priv, msg, args, argument1, argument2, argumentN) => {
        // The code that runs when your command is used.

        priv; // The privilege level of the person who used the command. One of the values in dibo.privilege.*
        msg;  // The Discord.js Message object that triggered this command. This means msg.author represents the command's user.
        args; // A list of command arguments as strings. Quoted multi-word arguments will be one string without the quotes.
        argument1; // the same as args[0]
        argument2; // the same as args[1]
        argumentN; // there can be as many arguments as you want, with whatever name that makes sense to you.
        // Arguments will always appear in the same order as they were given by the user.

        // todo explanation of database use and why to always use await between getting and setting a database value
        // draft:
        //... Always use use "await" on async functions between getting and setting a database value!
        // Not doing this can cause either this or another value write to be ignored.
        // It will not influence other keys, though, and it will go right most of the time - which makes it very hard
        // to debug an issue caused by async use of database keys.
    }
}




