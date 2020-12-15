const dibo = require('../libs/dibo');

module.exports = {
    'names': ['modrole'],
    'privilege': dibo.privilege.ADMIN,
    'summary': 'Manage the moderator role.',
    'help': 'Users with the moderator role are allowed to give me moderation commands. This can be any regular Discord server role. When this role is not defined, only server admins can use moderation commands.\n' +
        '\n' +
        '**Display the current moderator role:**\n' +
        '`%%pmodrole get`\n' +
        '\n' +
        '**Set the moderator role:**\n' +
        '`%%pmodrole set <role>`\n' +
        '\n' +
        '**Remove the moderator role:**\n' +
        '`%%pmodrole remove`',
    'func': async (priv, msg, args, action = '', roleText) => {
        action = action.toLowerCase();
        let modRole = await dibo.database.getGuildKey(msg.guild.id, 'modRole');
        switch (action.toLowerCase()) {
            case 'remove':
                modRole = '';
                await dibo.database.setGuildKey(msg.guild.id, 'modRole', modRole);
                dibo.log.info(`${msg.author} removed the mod role.`, undefined, msg.guild.id)
                return true;
            case 'set':
                let role = dibo.tools.textToRole(msg.guild, roleText);
                if (!role) {
                    return false;
                } else {
                    modRole = role.id;
                    await dibo.database.setGuildKey(msg.guild.id, 'modRole', modRole);
                    dibo.log.info(`${msg.member} set the mod role to \`${role.name}\`.`, undefined, msg.guild.id);
                    return true;
                }
            case 'get':
                msg.reply(`The current mod role is \`${findModRoleName(modRole, msg.guild)}\``);
                break;
            default:
                return dibo.commandHandler.run(msg, priv, 'help', ['modrole']);
        }
    }
}

function findModRoleName(roleId, guild) {
    let modRole;
    if (!roleId) {
        modRole = 'not set';
    } else {
        modRole = dibo.tools.getRoleName(guild, roleId) || 'set, but does not exist';
    }
    return modRole;
}
