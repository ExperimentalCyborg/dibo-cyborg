const dibo = require('../libs/dibo');

module.exports = {
    'names': ['muterole'],
    'privilege': dibo.privilege.ADMIN,
    'summary': 'Manage the mute role.',
    'help': 'The mute role should be configured to restrict users in some way as form of punishment. ' +
        'This is a regular discord server role which needs to be manually configured by an admin.' +
        '\n' +
        '**Display the current mute role:**\n' +
        '`%%c get`\n' +
        '\n' +
        '**Set the mute role:**\n' +
        '`%%c set <role>`\n' +
        '\n' +
        '**Remove the mute role:**\n' +
        '`%%c remove`',
    'func': async (priv, msg, args, action = '', roleText) => {
        action = action.toLowerCase();
        let muteRole = await dibo.database.getGuildKey(msg.guild.id, 'muteRole');
        switch (action.toLowerCase()) {
            case 'remove':
                muteRole = '';
                await dibo.database.setGuildKey(msg.guild.id, 'muteRole', muteRole);
                dibo.log.info(`${msg.author} removed the mute role.`, undefined, msg.guild.id)
                return true;
            case 'set':
                let role = dibo.tools.textToRole(msg.guild, roleText);
                if (!role) {
                    return false;
                } else {
                    muteRole = role.id;
                    await dibo.database.setGuildKey(msg.guild.id, 'muteRole', muteRole);
                    dibo.log.info(`${msg.member} set the mute role to \`${role.name}\`.`, undefined, msg.guild.id);
                    return true;
                }
            case 'get':
                msg.reply(`The current mute role is \`${findMuteRoleName(muteRole, msg.guild)}\``);
                break;
            default:
                return dibo.commandHandler.run(msg, priv, 'help', ['muterole']);
        }
    }
}

function findMuteRoleName(roleId, guild) {
    let muteRole;
    if (!roleId) {
        muteRole = 'not set';
    } else {
        muteRole = dibo.tools.getRoleName(guild, roleId) || 'set, but does not exist';
    }
    return muteRole;
}
