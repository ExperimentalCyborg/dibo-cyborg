const dibo = require('../libs/dibo');

dibo.client.on('message', async msg => {
    if (msg.partial || msg.author.system || msg.author.bot || !msg['guild']) {
        return;
    }

    // award activity points

    let lastMsgSent, activeMinutes;
    try {
        lastMsgSent = await dibo.database.getUserKey(msg.guild.id, msg.member.id, 'lastMsgSent', 0);
        activeMinutes = await dibo.database.getUserKey(msg.guild.id, msg.member.id, 'activeMinutes', 0);
    } catch (reason) {
        dibo.log.error(`Failed to get user active time data from database for ${await dibo.tools.textToMember(msg.author.id)}`,
            reason, msg.guild.id);
        return;
    }

    let errorText = `Failed to save user active time data to database for ${msg.author}`;
    if (timestampToMinutes(lastMsgSent) < timestampToMinutes(msg.createdTimestamp)) {
        activeMinutes += 1;
        await dibo.database.setUserKey(msg.guild.id, msg.member.id, 'activeMinutes', activeMinutes).
            catch(reason => dibo.log.error(errorText, reason, msg.guild.id));
    }
    lastMsgSent = msg.createdTimestamp;
    await dibo.database.setUserKey(msg.guild.id, msg.member.id, 'lastMsgSent', lastMsgSent).
        catch(reason => dibo.log.error(errorText, reason, msg.guild.id));

    // apply level roles if any

    let roles = await dibo.database.getGuildKey(msg.guild.id, 'rewardRoles', []);
    for(role of roles){ //{ role: '1234567890', minutes: 60 }
        if(role.minutes === activeMinutes){
            await doRoleAssignment();
        }
    }

    async function doRoleAssignment(){
        let removeOld = !await dibo.database.getGuildKey(msg.guild.id, 'rewardRolesAccumulate', false);
        for(role of roles){ //{ role: '1234567890', minutes: 60 }
            if(role.minutes < activeMinutes && removeOld){
                if(msg.member.roles.cache.get(role.role)){
                    console.log('HAS REMOVABLE ROLE'); //todo debug
                    await msg.member.roles.remove(role.role).then(()=>{
                        dibo.log.debug(`Removed reward role ${dibo.tools.textToRole(msg.guild, role.role)} from ${msg.member}`, undefined, msg.guild.id)
                    }).catch(reason => {
                        dibo.log.warn(`Failed to remove reward role ${dibo.tools.textToRole(msg.guild, role.role)} from ${msg.member}`, reason, msg.guild.id);
                    });
                }
            }
            if(role.minutes === activeMinutes){
                if(!msg.member.roles.cache.get(role.role)){
                    console.log('NOHAS AWARDABLE ROLE'); //todo debug
                    await msg.member.roles.add(role.role).then(()=>{
                        dibo.log.debug(`Rewarded role ${dibo.tools.textToRole(msg.guild, role.role)} to ${msg.member}`, undefined, msg.guild.id);
                    }).catch(reason => {
                        dibo.log.warn(`Failed to give reward role ${dibo.tools.textToRole(msg.guild, role.role)} to ${msg.member}`, reason, msg.guild.id);
                    });
                }
            }
        }
    }
});

function timestampToMinutes(timestamp) {
    return Math.floor((timestamp / 1000) / 60)
}
