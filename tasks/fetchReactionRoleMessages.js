const dibo = require('../libs/dibo');

dibo.client.on('ready', async () => {
    dibo.log.info('Fetching reaction role messages in the background...');

    let guildList = await dibo.database.getGuildList().catch(reason => {
        dibo.log.error('Failed to get guild list for reaction role preload', reason);
    });

    for (let guildId of guildList) {
        let reactionRoles = await dibo.database.getGuildKey(guildId, 'reactionRoles', {}).catch(reason => {
            dibo.log.error(`Failed to get reaction role list`, reason, guildId);
        });

        if(!reactionRoles){
            continue
        }

        for (const key of Object.keys(reactionRoles)) {
            let message = reactionRoles[key];

            let guild = dibo.client.guilds.cache.get(guildId);
            if(!guild) { // we might be kicked from the guild or it might be in another shard
                continue;
            }
            await guild.channels.cache.get(message.channel).messages.fetch(message).catch(reason => {
                // todo remove reaction roles for nonexistent messages
                dibo.log.error(`Failed to fetch reaction role message ${guildId}:${message}`, reason);
            });
        }
    }
    dibo.log.info('Done fetching reaction role messages');
});
