const dibo = require('../libs/dibo');
const Discord = require('discord.js');

module.exports = {
    'names': ['info', 'botinfo', 'i'],
    'privilege': dibo.privilege.USER,
    'summary': 'Learn more about me.',
    'help': '',
    'func': async (priv, msg, args) => {
        let mbed = new Discord.MessageEmbed();
        mbed.setTitle(`About ${dibo.settings.name || 'me'}`);
        mbed.setThumbnail(dibo.client.user.avatarURL());
        if(dibo.settings.description){ mbed.addField('Description', dibo.settings.description);}
        if(dibo.settings.websiteUrl){ mbed.addField('Website', dibo.settings.websiteUrl);}
        if(dibo.settings.inviteUrl){ mbed.addField('Add me to your server!', dibo.settings.inviteUrl);}
        if(dibo.settings.version){ mbed.addField('Version', dibo.settings.version, true);}
        mbed.addField('Guilds', await getGuildCount(), true);
        mbed.addField('Shard', `${dibo.client.shard.ids[0] + 1}/${dibo.client.shard.count}`, true);
        mbed.addField('Uptime', dibo.tools.durationToText(Date.now() - dibo.startTime), true);
        if(dibo.settings.author){ mbed.addField('Author', dibo.settings.author, true);}
        mbed.setFooter(`Requested by ${dibo.tools.memberToText(msg.member)})`);
        await msg.reply(mbed);
    }
}

async function getGuildCount(){
    try{
        let array = await dibo.client.shard.fetchClientValues('guilds.cache.size');
        return array.reduce((acc, guildCount) => acc + guildCount, 0);
    }catch (error){
        dibo.log.error('Failed to get guild count', error);
        return 'unavailable';
    }
}
