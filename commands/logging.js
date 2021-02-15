const dibo = require('../libs/dibo');

module.exports = {
    'names': ['logging'],
    'privilege': dibo.privilege.ADMIN,
    'summary': 'Configure logging to a channel.',
    'help': 'If enabled, i will keep you updated on my status, changes to settings, and any errors i encounter.\n' +
        '\n' +
        '**Display the current log channel**\n' +
        '`%%c get`\n' +
        '\n' +
        '**Enable logging**\n' +
        '`%%c enable <channel>`\n' +
        '\n' +
        '**Disable logging**\n' +
        '`%%c disable`',
    'func': async (priv, msg, args, action = '', channelText) => {
        let logChannel = await dibo.database.getGuildKey(msg.guild.id, 'logChannel');
        switch (action.toLowerCase()) {
            case 'get':
                let content;
                if (!logChannel) {
                    content = 'not configured';
                } else {
                    content = dibo.tools.getChannelName(msg.guild, logChannel);
                }
                content = `The log channel is ${content}.`;
                await msg.reply(content);
                break;
            case 'enable':
                let channel = dibo.tools.textToChannel(msg.guild, channelText);
                if (!channel) {
                    return false;
                }
                logChannel = channel.id;
                await dibo.database.setGuildKey(msg.guild.id, 'logChannel', logChannel);
                return true;
            case 'disable':
                logChannel = '';
                await dibo.database.setGuildKey(msg.guild.id, 'logChannel', logChannel);
                return true;
            default:
                await dibo.commandHandler.run(msg, priv, 'help', ['logging']);
                return false;
        }
    }
}
