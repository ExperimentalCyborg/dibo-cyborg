const dibo = require('../libs/dibo');

module.exports = {
    'names': ['editlogging'],
    'privilege': dibo.privilege.ADMIN,
    'summary': 'Configure message edit logging to a channel.',
    'help': 'All* message edits and deletions will be logged in the configured channel when this is enabled. System and bot messages are ignored.\n' +
        '\n' +
        '**Display the current edit log channel**\n' +
        '`%%c get`\n' +
        '\n' +
        '**Change which channel edit logs are sent to**\n' +
        '`%%c set <channel>`\n' +
        '\n' +
        '**Disable edit logging**\n' +
        '`%%c unset`\n' +
        '\n*Only in channels the bot is allowed to read. When older (uncached) messages are deleted, the deletion can not be logged. Without the "read message history" permission, edits on older messages can also not be logged.\n' +
        'The bottom of a log message shows the original message author. Deletions by moderators or other bots will still show the original author. To find out who deleted a message, check the server\'s audit log.',
    'func': async (priv, msg, args, action = '', channelText) => {
        let editLogChannel = await dibo.database.getGuildKey(msg.guild.id, 'editLogChannel');
        switch (action.toLowerCase()) {
            case 'get':
                let content;
                if (!editLogChannel) {
                    content = 'not configured';
                } else {
                    content = dibo.tools.getChannelName(msg.guild, editLogChannel);
                }
                content = `The edit log channel is ${content}.`;
                await msg.reply(content);
                break;
            case 'set':
                let channel = dibo.tools.textToChannel(msg.guild, channelText);
                if (!channel) {
                    return false;
                }
                editLogChannel = channel.id;
                await dibo.database.setGuildKey(msg.guild.id, 'editLogChannel', editLogChannel);
                return true;
            case 'unset':
                editLogChannel = '';
                await dibo.database.setGuildKey(msg.guild.id, 'editLogChannel', editLogChannel);
                return true;
            default:
                await dibo.commandHandler.run(msg, priv, 'help', ['editlogging']);
                return false;
        }
    }
}
