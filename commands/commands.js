const dibo = require('../libs/dibo');
const Discord = require('discord.js');

let mbedMaxFields = 25;

module.exports = {
    'names': ['commands'],
    'privilege': dibo.privilege.USER,
    'summary': 'Shows a list of all commands available to you.',
    'help': 'Commands are sorted first by privilege level and then alphabetically.',
    'func': async (priv, msg) => {
        let prefix = await dibo.getPrefix(msg.guild.id);

        // build sorted list of commands the user is allowed to execute
        let cmdList = [];
        dibo.commandsList.forEach(command => {
            if (dibo.commandHandler.canRun(priv, command)) {
                let summary = dibo.tools.getHelpText(dibo.commands, command, prefix)[0] || 'No summary available.';
                cmdList.push({
                    'cmdName': `${prefix}${command}`,
                    'summary': summary,
                    'priv': dibo.commands[command].privilege
                });
            }
        });

        cmdList = cmdList.sort((a, b) => { // sort by privilege then alphabetically
            if (a.priv < b.priv) {
                return -1;
            } else if (a.priv > b.priv) {
                return 1;
            } else {
                if (a.cmdName < b.cmdName) {
                    return -1;
                } else if (a.cmdName > b.cmdName) {
                    return 1;
                } else {
                    return 0;
                }
            }
        });

        // build messages and send them
        let msgIndex, cmdIndex, msgCount = Math.ceil(cmdList.length / mbedMaxFields);
        for (msgIndex = 0; msgIndex < msgCount; msgIndex++) {
            let mbed = new Discord.MessageEmbed();
            mbed.setTitle(`Available commands${msgCount > 1 ? ` (${msgIndex + 1}/${msgCount})` : ''}`);
            for (cmdIndex = 0; (cmdIndex + mbedMaxFields * msgIndex) < cmdList.length && cmdIndex < mbedMaxFields; cmdIndex++) {
                let cmd = cmdList[cmdIndex + mbedMaxFields * msgIndex];
                mbed.addField(cmd.cmdName, cmd.summary, true);
            }
            mbed.setFooter(`Requested by ${dibo.tools.memberToText(msg.member)})`);
            await msg.reply(mbed);
        }
    }
}
