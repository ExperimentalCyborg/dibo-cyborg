const dibo = require('../libs/dibo');
const Discord = require('discord.js');

dibo.log.logCallback = (async (level, guildId, message, data) => {
    try{
        await logToChannel(level, guildId, message, data);
    }catch (e) {
        dibo.log.error(`Unhandled exception in ${__filename}`, e, guildId, true);
        if(dibo.settings.debug){
            throw e;
        }
    }

});

async function logToChannel(level, guildId, message, data){
    let logChannelId = await dibo.database.getGuildKey(guildId, 'logChannel');
    if(!logChannelId){
        return;
    }

    let channel = dibo.tools.textToChannel(dibo.client.guilds.cache.get(guildId), logChannelId);
    if(!channel){
        return;
    }

    let mbed = new Discord.MessageEmbed();
    mbed.setTitle(`${level.toUpperCase()}`);
    mbed.setDescription(message);
    switch (level){
        case dibo.log.LVL_DEBUG:
            mbed.setColor('AQUA');
            if(data){
                mbed.addField('Data:', data.toString());
            }
            break;
        case dibo.log.LVL_WARNING:
            mbed.setColor('ORANGE');
            if(data){
                mbed.addField('Reason:', data.toString());
            }
            break;
        case dibo.log.LVL_ERROR:
            mbed.setColor('RED');
            if(data){
                mbed.addField('Reason:', data.toString());
            }
            break;
        default:
            mbed.setColor('WHITE');
            if(data){
                mbed.addField('Extra info:', data.toString());
            }
            break;
    }
    mbed.setFooter(`${dibo.name} v${dibo.version} shard ${dibo.client.shard.ids[0] + 1}/${dibo.client.shard.count}`)
    mbed.setTimestamp();
    channel.send(mbed).catch(reason => {
        dibo.log.warn(`Failed to send message in log channel`, reason, guildId, true);
    });
}
