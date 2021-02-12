const dibo = require('./../libs/dibo');

module.exports = {
    'names': ['unban', 'pardon'],
    'privilege': dibo.privilege.MOD,
    'summary': 'Undo a ban.',
    'help': '`%%c <user> [reason]`',
    'func': async (priv, msg, args, userText) => {
        if(!userText){
            return dibo.commandHandler.run(msg, priv, 'help', ['unban']);
        }

        let user = await dibo.tools.textToMember(msg.guild, userText);
        if(!user){
            return false;
        }

        return await dibo.cyborg.moderation.unban(msg.author, user, args.slice(1).join(' ') || undefined);
    }
}
