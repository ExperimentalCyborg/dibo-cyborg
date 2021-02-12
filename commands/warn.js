const dibo = require('./../libs/dibo');

module.exports = {
    'names': ['warn', 'warning'],
    'privilege': dibo.privilege.MOD,
    'summary': 'Warn a user, and add it to their record.',
    'help': '`%%c <user> <reason>`',
    'func': async (priv, msg, args, userText) => {
        if(!userText){
            return dibo.commandHandler.run(msg, priv, 'help', ['warn']);
        }

        let user = await dibo.tools.textToMember(msg.guild, userText);
        if(!user){
            return false;
        }

        return await dibo.cyborg.moderation.warn(msg.author, user, args.slice(1).join(' ') || undefined);
    }
}
