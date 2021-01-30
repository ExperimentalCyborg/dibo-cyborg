const dibo = require('../libs/dibo');
const Discord = require('discord.js');

module.exports = {
    'names': ['channelrestrictions', 'cr'],
    'privilege': dibo.privilege.ADMIN,
    'summary': 'Disable commands for users in specific channels.',
    'help': 'This does not affect Moderators and Admins.\n' +
        '\n' +
        '**Display the current configuration:**\n' +
        '`%%pchannelrestrictions list`\n' +
        '\n' +
        '**Set the restriction type:**\n' +
        '`%%pchannelrestrictions type <blacklist|whitelist>`\n' +
        '\n' +
        '**Add a channel to the list:**\n' +
        '`%%pchannelrestrictions add <channel>`\n' +
        '\n' +
        '**Remove a channel from the list:**\n' +
        '`%%pchannelrestrictions remove <channel>`\n' +
        '\n' +
        '**Clear the list:**\n' +
        '`%%pchannelrestrictions clear`\n' +
        'Doing this in whitelist mode entirely disables commands for users until channels are added.',
    'func': async (priv, msg, args, action = '', value = '') => {
        let restrictions = await dibo.database.getGuildKey(msg.guild.id,
            'channelRestrictions', dibo.commandHandler.defaultChannelRestrictions);
        switch (action.toLowerCase()) {
            case 'list':
                let mbed = new Discord.MessageEmbed();
                mbed.setTitle(`User command restrictions`);
                mbed.addField('Type', restrictions['type']);
                let channelList = [];
                restrictions['channels'].forEach(channelId => {
                    channelList.push(dibo.tools.textToChannel(msg.guild, channelId));
                });
                mbed.addField('Channels', channelList.join('\n') || 'No channels listed.');
                mbed.setFooter(`Requested by ${msg.member.nickname || msg.author.username} (${msg.author.tag})`);
                msg.reply(mbed);
                break;
            case 'type':
                if (value.toLowerCase() === 'blacklist') {
                    restrictions['type'] = 'blacklist';
                } else if (value.toLowerCase() === 'whitelist') {
                    restrictions['type'] = 'whitelist';
                } else {
                    return false;
                }
                await dibo.database.setGuildKey(msg.guild.id, 'channelRestrictions', restrictions);
                return true;
            case 'add':
                if (!value) {
                    return false;
                }
                args.slice(1).forEach(channelText => {
                    let channel = dibo.tools.textToChannel(msg.guild, channelText);
                    if (channel) {
                        if(restrictions['channels'].indexOf(channel.id) === -1){
                            restrictions['channels'].push(channel.id);
                        }
                    } else {
                        return false;
                    }
                });
                await dibo.database.setGuildKey(msg.guild.id, 'channelRestrictions', restrictions);
                return true;
            case 'remove':
                if (!value) {
                    return false;
                }
                args.slice(1).forEach(channelText => {
                    let channel = dibo.tools.textToChannel(msg.guild, channelText);
                    if (channel) {
                        let index = restrictions['channels'].indexOf(channel.id);
                        if(index !== -1){
                            restrictions['channels'].splice(index, 1);
                        }
                    } else {
                        return false;
                    }
                });
                await dibo.database.setGuildKey(msg.guild.id, 'channelRestrictions', restrictions);
                return true;
            case 'clear':
                restrictions['channels'] = [];
                await dibo.database.setGuildKey(msg.guild.id, 'channelRestrictions', restrictions);
                return true;
            default:
                return dibo.commandHandler.run(msg, priv, 'help', ['channelrestrictions']);
        }
    }
}