const dibo = require('../libs/dibo');
const Discord = require('discord.js');

module.exports = {
    'names': ['commands'],
    'privilege': dibo.privilege.USER,
    'summary': 'Shows a list of all commands available to you.',
    'help': '',
    'func': async (priv, msg) => {
        let prefix = await dibo.getPrefix(msg.guild.id);
        let mbed = new Discord.MessageEmbed();
        mbed.setTitle(`Available commands`);
        dibo.commandsList.forEach(command => {
            if (dibo.commandHandler.can_run(priv, command)) { // todo .filter?
                let summary = dibo.tools.getHelpText(dibo.commands, command, prefix)[0]  || 'No summary available.';
                mbed.addField(`${prefix}${command}`, summary, true);
            }
        });
        mbed.setFooter(`Requested by ${msg.member.nickname || msg.author.username} (${msg.author.tag})`);
        await msg.reply(mbed);
    }
}
