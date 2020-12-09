const dibo = require('../libs/dibo');

module.exports = {
    'names': ['activity', 'talktime', 'level', 'lvl'],
    'privilege': dibo.privilege.USER,
    'summary': 'Displays how long you have been active in this server.',
    'help': 'Activity is calculated based on messages you have sent. Only whole minutes are counted. This means that two messages in one minute count as one minute, but two messages in five minutes count as two minutes.',
    'func': async (priv, msg) => {
        let minutes = await dibo.database.getUserKey(msg.guild.id, msg.author.id, 'activeMinutes', 0);
        await msg.reply(`You have been active for \`${Math.floor(minutes / 60)}\` hours and \`${minutes % 60}\` minutes.`);
    }
}
