const dibo = require('../libs/dibo');

module.exports = {
    'names': ['activity', 'talktime', 'level', 'lvl', 'rank'],
    'privilege': dibo.privilege.USER,
    'summary': 'Displays how long you have been active in this server.',
    'help': 'Activity is calculated based on messages you have sent. Only whole minutes are counted. This means that two messages in one minute count as one minute, but two messages in five minutes count as two minutes.\n\n' +
        '**Request your own active time**\n' +
        '`%%c`\n\n' +
        '**Request someone else\'s active time**\n' +
        '`%%c [user]`',
    'func': async (priv, msg, args, user) => {
        let subject;
        if (user) {
            user = await dibo.tools.textToMember(msg.guild, user);
            if (!user) {
                return false;
            }
            subject = `${dibo.tools.memberToText(user)} has `;
        } else {
            user = msg.author
            subject = 'You have'
        }

        let minutes = await dibo.database.getUserKey(msg.guild.id, user.id, 'activeMinutes', 0);
        await msg.reply(`${subject} been active for \`${Math.floor(minutes / 60)}\` hours and \`${minutes % 60}\` minutes.`);
    }
}
