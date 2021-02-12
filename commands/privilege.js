const dibo = require('../libs/dibo');

module.exports = {
    'names': ['privilege', 'priv'],
    'privilege': dibo.privilege.USER,
    'summary': 'Check your (bot) privilege.',
    'help': '`%%c [user]`',
    'func': async (priv, msg, args, user) => {
        if(user){
            let member = await dibo.tools.textToMember(msg.guild, user);
            if(!member){
                return false;
            }
            priv = await dibo.checkPrivilege(member);
            await msg.reply(`${dibo.tools.memberToText(member)} is \`${priv}\`.`);
        }else{
            await msg.reply(`You are \`${priv}\`.`);
        }
    }
}
