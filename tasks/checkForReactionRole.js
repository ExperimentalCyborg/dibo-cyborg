const dibo = require('../libs/dibo');

async function processReaction(remove, reaction, usr){
    if (usr.system || usr.bot) {
        return;
    }

    let guild;
    try {
        guild = reaction.message.guild;
    }catch{}

    if (reaction.partial) { // for reactions on messages we don't have in memory
        try {
            await reaction.fetch(); // load the missing message
        } catch (error) {
            dibo.log.error('Failed to fetch message reaction', error, guild.id);
            return;
        }
    }

    let reactRoles = await dibo.database.getGuildKey(guild.id, 'reactionRoles', {});
    let msgId = reaction.message.id;
    let emoji = reaction.emoji.toString();
    let role;
    try{
        role = reactRoles[msgId]['roles'][emoji];
        if(!role){
            return;
        }
    }catch{return;}


    if (usr.partial) { // for users we don't have in memory
        try {
            await reaction.users.fetch(); // load the missing user(s)
        } catch (error) {
            dibo.log.error('Failed to fetch reaction user(s)', error, guild.id);
            return;
        }
    }

    let member = await dibo.tools.textToMember(guild, usr.id).catch(reason => {
        dibo.log.debug(`ReactionRole Failed to get member from user`, usr, guild.id);
    });
    if(!member){
        return;
    }

    if(remove){
        await member.roles.remove(role).then(()=>{
            dibo.log.debug(`${member} dropped reaction role ${role}`, undefined, guild.id);
        }).catch(reason => {
            dibo.log.warn(`Failed to remove reaction role ${role} from ${member}`, reason, guild.id);
        });
    }else{
        await member.roles.add(role).then(()=>{
            dibo.log.debug(`${member} grabbed reaction role ${role}`, undefined, guild.id);
        }).catch(reason => {
            dibo.log.warn(`Failed to assign reaction role ${role} to ${member}`, reason, guild.id);
        });
    }
}

dibo.client.on('messageReactionRemove', async (reaction, usr) => {
    await processReaction(true, reaction, usr);
});

dibo.client.on('messageReactionAdd', async (reaction, usr) => {
    await processReaction(false, reaction, usr);
});
