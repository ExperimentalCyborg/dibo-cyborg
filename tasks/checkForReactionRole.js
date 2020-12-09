const dibo = require('../libs/dibo');

dibo.client.on('messageReactionAdd', async (reaction, usr) => {
    if (usr.system || usr.bot) {
        return
    }

    let guildId;
    try {
        guildId = reaction.message.guild.id;
    }catch{}

    if (reaction.partial) { // for reactions on messages we don't have in memory
        try {
            await reaction.fetch(); // load the missing message
        } catch (error) {
            dibo.log.error('Failed to fetch message reaction', error, guildId);
            return;
        }
    }

    if (usr.partial) { // for reactions on messages we don't have in memory
        try {
            await reaction.users.fetch(); // load the missing user(s)
        } catch (error) {
            dibo.log.error('Failed to fetch reaction user(s)', error, guildId);
            return;
        }
    }

    let msgId = reaction.message.id;
    let emoji = reaction.emoji.toString();
    let reactRoles = await dibo.database.getGuildKey(guildId, 'reactionRoles', {});

    if (reactRoles.hasOwnProperty(msgId) && reactRoles[msgId]['roles'].hasOwnProperty(emoji)) {
        let key_value, user, reactionUsers = reaction.users.cache; // All users who reacted to this message
        for (key_value of reactionUsers) {
            user = key_value[1]; // Grab just the value, we don't need the key
            if(user.bot || !user.id){ // Ignore bots and partial users that don't have an ID
                continue;
            }

            await reaction.message.guild.members.fetch(user.id).then(async member => { // Fetch the user because they might not be cached yet
                await member.roles.add(reactRoles[msgId]['roles'][emoji]).then(()=>{
                    reaction.users.remove(user).catch(reason => {
                        dibo.log.error('Failed to remove reaction after reaction role assignment', reason, guildId);
                    });
                }).catch(reason => {
                    dibo.log.error(`Failed to assign reaction role to ${user}`, reason, guildId);
                });
            }).catch(reason => {
                dibo.log.debug('Failed to fetch reaction user', reason, guildId);
                reaction.users.remove(user).catch(reason => {
                    dibo.log.debug('Failed to remove user reaction after failure to fetch user', reason, guildId);
                });
            });
        }
    }
});
