const dibo = require('../libs/dibo');

module.exports = {
    'names': ['reporting'],
    'privilege': dibo.privilege.ADMIN,
    'summary': 'Configure where reports get sent.',
    'help': 'If this is disabled while logging is enabled, reports are sent to the log channel. ' +
        'If both are disabled, reporters will receive a DM advising them to contact server staff.\n' +
        '\n' +
        '**Display the current reports channel**\n' +
        '`%%c get`\n' +
        '\n' +
        '**Change which channel reports are sent to**\n' +
        '`%%c set <channel>`\n' +
        '\n' +
        '**Send reports to the logging channel**\n' +
        '`%%c unset`',
    'func': async (priv, msg, args, action = '', channelText) => {
        let reportChannel = await dibo.database.getGuildKey(msg.guild.id, 'reportChannel');
        switch (action.toLowerCase()) {
            case 'get':
                let content;
                if (!reportChannel) {
                    let logChannel = await dibo.database.getGuildKey(msg.guild.id, 'logChannel');
                    if (!logChannel) {
                        content = 'not configured';
                    } else {
                        content = `the log channel: ${dibo.tools.getChannelName(msg.guild, logChannel)}`;
                    }
                } else {
                    content = dibo.tools.getChannelName(msg.guild, reportChannel);
                }
                content = `The report channel is ${content}.`;
                await msg.reply(content);
                break;
            case 'set':
                let channel = dibo.tools.textToChannel(msg.guild, channelText);
                if (!channel) {
                    return false;
                }
                reportChannel = channel.id;
                await dibo.database.setGuildKey(msg.guild.id, 'reportChannel', reportChannel);
                return true;
            case 'unset':
                reportChannel = '';
                await dibo.database.setGuildKey(msg.guild.id, 'reportChannel', reportChannel);
                return true;
            default:
                await dibo.commandHandler.run(msg, priv, 'help', ['reporting']);
                return false;
        }
    }
}
