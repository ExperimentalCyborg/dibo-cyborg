const dibo = require('../libs/dibo');
const Discord = require('discord.js');

module.exports = {
    'names': ['help'],
    'privilege': dibo.privilege.USER,
    'summary': 'Display information on how to use a command.',
    'help': 'Use `%%phelp name_of_command` to see the help text for that command. For example, `%%phelp ping` will show you information about the `%%pping` command.\n' +
        'To see which commands are available to you, use `%%pcommands`.',
    'func': async (priv, msg, args, topic = '') => {
        let prefix = await dibo.getPrefix(msg.guild.id);
        topic = topic.toLowerCase();
        if (!topic || !dibo.commandHandler.can_run(priv, topic)) {
            topic = 'help';
        }

        let helpText = dibo.tools.getHelpText(dibo.commands, topic, prefix);
        if (!helpText) {
            return false;
        }
        let summary = helpText[0];
        let body = helpText[1] || '(No detailed explanation available.)';

        let mbed = new Discord.MessageEmbed();
        mbed.setTitle(`Help for \`${prefix}${dibo.commands[topic].names[0]}\``);
        mbed.addField(summary, body);
        if(dibo.commands[topic].names.length > 1){
            let aliases = dibo.commands[topic].names.slice(1).map(value => {
                return `\`${prefix}${value}\``;
            });
            mbed.addField('Aliases:', aliases.join(', '));
        }
        mbed.setFooter(`Requested by ${msg.member.nickname || msg.author.username} (${msg.author.tag})`);
        await msg.reply(mbed);
    }
}
