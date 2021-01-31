const dibo = require('../libs/dibo');

module.exports = {
    'names': ['purge', 'clean', 'nuke'],
    'privilege': dibo.privilege.MOD,
    'summary': 'Bulk delete messages, optionally with a filter.',
    'help': 'Beware that deleting messages older than 14 days may take a very long time or fail completely due to the way Discord stores messages. You can only run one purge at a time.\n' +
        '\n' +
        '**Remove all messages in a channel:**\n' +
        '`%%ppurge all`\n' +
        '\n' +
        '**Remove the last <n> messages:**\n' +
        '`%%ppurge last <n>`\n' +
        '\n' +
        '**Stop a long running purge task:**\n' +
        '`%%ppurge stop`\n',
    'func': async (priv, msg, args, action = '', amount, userText) => {
        let guildId = msg.guild.id;
        action = action.toLowerCase();

        if (['stop', 'all', 'last'/*, 'user', 'word', 'reactions'*/].indexOf(action) < 0) {
            return dibo.commandHandler.run(msg, priv, 'help', ['purge']);
        }

        if (action === 'stop') {
            delete dibo.cyborg.purges[guildId]; // clear the purging flag so any async actions abort
            return true;
        }

        if (dibo.cyborg.purges.hasOwnProperty(guildId)) { // make sure we don't start concurrent purges
            dibo.log.warn(`Failed to purge ${msg.channel}`,
                `Already purging ${dibo.tools.textToChannel(msg.guild, dibo.cyborg.purges[guildId])}`, guildId);
            return false;
        }

        let success = undefined; // true would attempt to react a checkmark, which we don't want since the msg is gone
        switch (action) {
            case 'all':
                await dibo.cyborg.bulkDeleteMessages(msg.author, msg.channel).catch(reason => {
                    success = false;
                });
                return success;
            case 'last':
                if(!dibo.tools.isNumeric(amount)){
                    return false;
                }
                amount = parseInt(amount) + 1;
                if (amount > 100) {
                    amount = 100;
                }
                await dibo.cyborg.bulkDeleteMessages(msg.author, msg.channel, amount).catch(reason => {
                    success = false;
                });
                return success;
            /*case 'user':
                // purge user N user
                break;
            case 'word':
                // purge word N word word word ..
                break;
            case 'reactions':
                break;*/
        }
    }
}
