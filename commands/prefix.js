const dibo = require('../libs/dibo');

module.exports = {
    'names': ['prefix'],
    'privilege': dibo.privilege.ADMIN,
    'summary': 'Change the bot command prefix.',
    'help': '\n**Display the current prefix:**\n' +
        '`%%pprefix get`\n\n' +
        '**Change the prefix:**\n' +
        '`%%pprefix set <prefix>`\n\n' +
        '**Reset the prefix to the default:**\n' +
        '`%%pprefix reset`',
    'func': async (priv, msg, args, action = '', prefixText = '') => {
        action = action.toLowerCase();
        if (action !== 'get' && action !== 'set' && action !== 'reset') {
            return dibo.commandHandler.run(msg, priv, 'help', ['prefix']);
        }

        switch (action){
            case "get":
                let prefix = await dibo.getPrefix(msg.guild.id);
                msg.reply(`My prefix is \`${prefix}\``);
                break;
            case "set":
                await dibo.database.setGuildKey(msg.guild.id, 'prefix', prefixText);
                dibo.log.info(`${msg.author} set the prefix to \`${prefixText}\``, undefined, msg.guild.id);
                return true;
            case "reset":
                await dibo.database.setGuildKey(msg.guild.id, 'prefix', dibo.defaultPrefix);
                dibo.log.info(`${msg.author} reset the prefix back to \`${dibo.defaultPrefix}\``, undefined, msg.guild.id);
                return true;
        }
    }
}