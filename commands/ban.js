const dibo = require('./../libs/dibo');

module.exports = {
    'names': ['ban'],
    'privilege': dibo.privilege.MOD,
    'summary': 'Ban a user, temporarily or permanently.',
    'help': '`%%pban <user> [duration] [reason]`\n\n' +
        'Duration must be a whole number. Examples:\n' +
        '`%%pban baduser#1234 30 my reason here` will ban for 30 minutes.\n' +
        '`%%pban baduser#1234 2h my reason here` will ban for 2 hours.\n' +
        '`%%pban baduser#1234 14d my reason here` will ban for 14 days.\n' +
        '`%%pban baduser#1234 perm my reason here` will ban permanently.\n' +
        '\nAny invalid duration is automatically a permanent ban. That means this also results in a permanent ban:\n' +
        '`%%pban baduser#1234 forever my reason here`',
    'func': async (priv, msg, args, userText = '', durationText = '') => {
        //msg.delete(); //todo ninja mode

        if(!userText){
            return dibo.commandHandler.run(msg, priv, 'help', ['ban']);
        }

        let user = await dibo.tools.textToMember(msg.guild, userText);
        if(!user){
            return false;
        }

        let duration = dibo.cyborg.moderation.durationTextToMinutes(durationText);
        return await dibo.cyborg.moderation.ban(msg.author, user, duration, args.slice(2).join(' ') || undefined);
    }
}
