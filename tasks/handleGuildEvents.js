const dibo = require('../libs/dibo');

dibo.client.on('guildCreate', guild => {
    dibo.log.info('Joined guild', `${guild.id} ${guild.name}`);
    dibo.database.setGuildKey(guild.id, 'joinDate', Date.now()).catch(reason => {
        dibo.log.error('Failed to store guild joinDate', [reason, guild.id]);
    });
});

dibo.client.on('guildDelete', guild => {
    dibo.log.info('Removed from guild', `${guild.id} ${guild.name}`);
    dibo.database.deleteGuild(guild.id).catch(reason => {
        dibo.log.error('Failed to delete guild data', [reason, guild.id]);
    });
});
