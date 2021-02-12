const dibo = require('./../libs/dibo');

module.exports = {
    'names': ['unmute', 'unsilence'],
    'privilege': dibo.privilege.MOD,
    'summary': 'Undo a mute.',
    'help': '`%%c <user> [reason]`',
    'func': async (priv, msg, args, userText) => {
        if(!userText){
            return dibo.commandHandler.run(msg, priv, 'help', ['unmute']);
        }

        let user = await dibo.tools.textToMember(msg.guild, userText);
        if(!user){
            return false;
        }

        return await dibo.cyborg.moderation.unmute(msg.author, user, args.slice(1).join(' ') || undefined);
    }
}
