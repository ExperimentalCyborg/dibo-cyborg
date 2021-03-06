const dibo = require('../libs/dibo');

module.exports = {
    'names': ['role', 'r'],
    'privilege': dibo.privilege.MOD,
    'summary': 'Add roles to or remove roles from users.',
    'help': '\n**Give someone a role:**\n' +
        '`%%c add <role> <user>`\n\n' +
        '**Remove a role from someone:**\n' +
        '`%%c remove <role> <user>`',
    'func': async (priv, msg, args, cmd = '', roleText, userText) => {
        cmd = cmd.toLowerCase();
        if (cmd !== 'add' && cmd !== 'remove') {
            await dibo.commandHandler.run(msg, priv, 'help', ['role']);
            return false;
        }

        let success = false;
        let guildId = msg.guild.id;
        let role = dibo.tools.textToRole(msg.guild, roleText);
        let member = await dibo.tools.textToMember(msg.guild, userText);
        if(!member){
            throw 'Invalid member identifier';
        }
        if(!role){
            throw 'Invalid role identifier';
        }

        if(await dibo.checkPrivilege(msg.member) === dibo.privilege.MOD){
            let memberPriv = await dibo.checkPrivilege(member);
            if(memberPriv !== dibo.privilege.USER){
                dibo.log.warn(`${msg.member} tried to edit roles of ${memberPriv} ${member}.`, undefined, member.guild.id);
                return false;
            }
        }

        await member.fetch();
        switch (cmd.toLowerCase()) {
            case 'add':
                await member.roles.add(role).then(() => {
                    success = true;
                    dibo.log.info(`${msg.author} gave role \`${role.name}\` to ${member}`, undefined, guildId);
                }).catch(reason => {
                    dibo.log.warn(`${msg.author} failed to give role \`${role.name}\` to ${member}`, reason, guildId);
                })
                break;
            case 'remove':
                await member.roles.remove(role).then(() => {
                    success = true;
                    dibo.log.info(`${msg.author} removed role \`${role.name}\` from ${member}`, undefined, guildId);
                }).catch(reason => {
                    dibo.log.warn(`${msg.author} failed to remove role \`${role.name}\` from ${member}`, reason, guildId);
                });
                break;
        }
        return success;
    }
}
