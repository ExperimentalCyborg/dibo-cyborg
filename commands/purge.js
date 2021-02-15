const dibo = require('../libs/dibo');

module.exports = {
    'names': ['purge', 'clean', 'nuke'],
    'privilege': dibo.privilege.MOD,
    'summary': 'Bulk delete messages, optionally with a filter.',
    'help': 'Beware that deleting messages older than 14 days may take a very long time or fail completely due to the way Discord stores messages. You can only run one purge at a time.\n' +
        '\n' +
        '**Remove all messages in a channel:**\n' +
        '`%%c all`\n' +
        '\n' +
        '**Remove the last few messages in a channel:**\n' +
        '`%%c <amount>`\n' +
        '`%%c last <amount>`\n' +
        '\n' +
        '**Remove a user\'s messages in a channel:**\n' +
        '`%%c user <user> [amount]`\n' +
        '\n' +
        '**Remove messages containing a specific word in a channel:**\n' +
        '`%%c word <badword> [amount]`\n' +
        '\n' +
        '**Stop a long running purge task:**\n' +
        '`%%c stop`\n',
    'func': async (priv, msg, args, action = '', arg1, arg2) => {
        let guildId = msg.guild.id;
        action = action.toLowerCase();

        if (dibo.tools.isNumeric(action) && !arg1) { // support "!purge n" for quickly removing the last n messages
            arg1 = action;
            action = 'last';
        }

        if (action === 'stop') {
            delete dibo.cyborg.purges[guildId];
            return true;
        }

        // can't be a default switch due to preprocessing
        if (['all', 'last', 'user', 'word'].indexOf(action) < 0) {
            await dibo.commandHandler.run(msg, priv, 'help', ['purge']);
            return false;
        }

        if (dibo.cyborg.purges.hasOwnProperty(guildId)) { // make sure we don't start concurrent purges
            dibo.log.warn(`Failed to purge ${msg.channel}`,
                `Already purging ${dibo.tools.textToChannel(msg.guild, dibo.cyborg.purges[guildId])}`, guildId);
            return false;
        }

        let limit, amountText;
        switch (action) {
            case 'all':
                dibo.log.info(`${msg.author} started the purge of all messages in ${msg.channel}.`, undefined, guildId);
                await dibo.cyborg.bulkDeleteMessages(msg.channel);
                break;
            case 'last':
                if (!dibo.tools.isNumeric(arg1)) {
                    await dibo.commandHandler.run(msg, priv, 'help', ['purge']);
                    return false;
                }
                arg1 = parseInt(arg1) + 1;
                dibo.log.info(`${msg.author} started the purge of ${arg1 - 1} messages in ${msg.channel}.`, undefined, guildId);
                await dibo.cyborg.bulkDeleteMessages(msg.channel, arg1);
                break;
            case 'user':
                if (!arg1) {
                    await dibo.commandHandler.run(msg, priv, 'help', ['purge']);
                    return false;
                }
                let user = await dibo.tools.textToMember(msg.guild, arg1);
                if (!user) {
                    return false;
                }

                limit = -1;
                if (dibo.tools.isNumeric(arg2)) { // the first argument is a valid integer (interpret as amount)
                    limit = parseInt(arg2) + 1;
                }
                amountText = (limit > 0) ? limit - 1 : 'all';
                dibo.log.info(`${msg.author} started the purge of ${amountText} messages by ${user} in ${msg.channel}.`, undefined, guildId);
                await dibo.cyborg.bulkDeleteMessages(msg.channel, limit, getUserFilter(user.id));
                break;
            case 'word':
                if (!arg1) {
                    await dibo.commandHandler.run(msg, priv, 'help', ['purge']);
                    return false;
                }

                limit = -1;
                if (dibo.tools.isNumeric(arg2)) { // the first argument is a valid integer (interpret as amount)
                    limit = parseInt(arg2) + 1;
                }

                amountText = (limit > 0) ? limit - 1 : 'all';
                dibo.log.info(`${msg.author} started the purge of ${amountText} messages containing "${arg1}" in ${msg.channel}.`, undefined, guildId);
                await dibo.cyborg.bulkDeleteMessages(msg.channel, limit, getWordFilter(arg1));
                break;
        }
    }
}

function getUserFilter(userId) {
    return msg => msg.author.id === userId;
}

function getWordFilter(word) {
    //todo remove nonprinting characters, do number and unicode substitutions, use regex. Maybe existing lib?
    return msg => msg.content.toLowerCase().indexOf(word.toLowerCase()) >= 0; // dumb approach
}
