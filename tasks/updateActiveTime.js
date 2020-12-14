const dibo = require('../libs/dibo');

dibo.client.on('message', async msg => {
    if (msg.partial || msg.author.system || msg.author.bot || !msg['guild']) {
        return;
    }

    let lastMsgSent, activeMinutes;
    try {
        lastMsgSent = await dibo.database.getUserKey(msg.guild.id, msg.member.id, 'lastMsgSent', 0);
        activeMinutes = await dibo.database.getUserKey(msg.guild.id, msg.member.id, 'activeMinutes', 0);
    } catch (reason) {
        dibo.log.error(`Failed to get user active time data from database for ${await dibo.tools.textToMember(msg.author.id)}`,
            reason, msg.guild.id);
        return;
    }

    if (timestampToMinutes(lastMsgSent) < timestampToMinutes(msg.createdTimestamp)) {
        activeMinutes += 1;
    }
    lastMsgSent = msg.createdTimestamp;

    try {
        await dibo.database.setUserKey(msg.guild.id, msg.member.id, 'lastMsgSent', lastMsgSent);
        await dibo.database.setUserKey(msg.guild.id, msg.member.id, 'activeMinutes', activeMinutes);
    } catch (reason) {
        dibo.log.error(`Failed to save user active time data to database for ${await dibo.tools.textToMember(msg.author.id)}`,
            reason, msg.guild.id);
    }
});

function timestampToMinutes(timestamp) {
    return Math.floor((timestamp / 1000) / 60)
}
