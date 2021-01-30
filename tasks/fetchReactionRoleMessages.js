const dibo = require('../libs/dibo');
const Discord = require('discord.js');
const bnf = require('bonnefooi');

new bnf(dibo).cyborg.fetchReactionRoleMessages = fetchReactionRoleMessages;

dibo.client.on('ready', async () => {
    dibo.log.info('Fetching reaction role messages in the background...');
    let guildList = await dibo.database.getGuildList().catch(reason => {
        dibo.log.error('Failed to get guild list for reaction role preload', reason);
    });

    for (let guildId of guildList) {
        await fetchReactionRoleMessages(guildId).catch(reason => {
            dibo.log.error('Uncaught error in fetchReactionRoleMessages', reason);
        });
    }

    dibo.log.info('Done fetching reaction role messages');
});

async function fetchReactionRoleMessages(guildId) {
    let reactionRoles = await dibo.database.getGuildKey(guildId, 'reactionRoles', {}).catch(reason => {
        dibo.log.error(`Failed to get reaction role list`, reason, guildId);
    });

    if (!reactionRoles) {
        return;
    }

    for (const key of Object.keys(reactionRoles)) {
        let channelId = reactionRoles[key].channel;

        let guild = dibo.client.guilds.cache.get(guildId);
        if (!guild) { // we might be kicked from the guild or it might be in another shard
            continue;
        }

        let channel = guild.channels.cache.get(channelId);
        if (channel) {
            await channel.messages.fetch(key, true, true).catch(async reason => {
                if (reason.code === Discord.Constants.APIErrors.UNKNOWN_MESSAGE) {
                    delete reactionRoles[key];
                    await dibo.database.setGuildKey(guildId, 'reactionRoles', reactionRoles).catch(reason => {
                        dibo.log.debug('Failed to delete stale reaction role entries', reason, guildId);
                    });
                    dibo.log.debug(`Deleted reaction role entry for deleted message ${key} in channel ${dibo.tools.textToChannel(guild, channelId)}`, reason, guildId);
                } else {
                    dibo.log.warn(`Failed to load reaction role message ${key} in channel ${dibo.tools.textToChannel(guild, channelId)}`, reason, guildId);
                }
            });
        } else {
            delete reactionRoles[key];
            await dibo.database.setGuildKey(guildId, 'reactionRoles', reactionRoles).catch(reason => {
                dibo.log.debug('Failed to delete stale reaction role entries', reason, guildId);
            });
            dibo.log.debug(`Deleted reaction role entry for unknown channel ${channelId}`, undefined, guildId);
        }
    }
}

