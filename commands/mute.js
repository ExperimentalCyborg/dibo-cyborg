const dibo = require('./../libs/dibo');

module.exports = {
    'names': ['mute', 'silence'],
    'privilege': dibo.privilege.MOD,
    'summary': 'Mute a user, temporarily or permanently.',
    'help': '`%%pmute <user> [duration] [reason]`\n\n' +
        'Duration must be a whole number. Examples:\n' +
        '`%%pmute baduser#1234 30 my reason here` will mute for 30 minutes.\n' +
        '`%%pmute baduser#1234 2h my reason here` will mute for 2 hours.\n' +
        '`%%pmute baduser#1234 14d my reason here` will mute for 14 days.\n' +
        '`%%pmute baduser#1234 perm my reason here` will mute permanently.\n' +
        '\nAny invalid duration is automatically a permanent mute. That means this also results in a permanent mute:\n' +
        '`%%pmute baduser#1234 forever my reason here`',
    'func': async (priv, msg, args, userText = '', durationText = '') => {
        if(!userText){
            return dibo.commandHandler.run(msg, priv, 'help', ['mute']);
        }

        let user = await dibo.tools.textToMember(msg.guild, userText);
        if(!user){
            return false;
        }

        durationText = durationText.toLowerCase();
        let duration;
        if(durationText.endsWith('h')){
            durationText = durationText.slice(0, -1);
            duration = parseInt(durationText) * 60;
        }else if(durationText.endsWith('d')){
            durationText = durationText.slice(0, -1);
            duration = parseInt(durationText) * 60 * 24;
        }else if(durationText.endsWith('m')){
            durationText = durationText.slice(0, -1);
            duration = parseInt(durationText)
        }else{
            duration = parseInt(durationText)
        }

        return await dibo.cyborg.moderation.mute(msg.author, user, args.slice(2).join(' ') || undefined, duration);
    }
}
