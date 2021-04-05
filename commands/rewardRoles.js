const dibo = require('../libs/dibo');

module.exports = {
    'names': ['activityroles', 'rewardroles', 'ar'],
    'privilege': dibo.privilege.ADMIN,
    'summary': 'Configure roles given based on activity.',
    'help': 'User\'s active time is tracked. Based on this, they can automatically earn roles.\n\n' +
        '**Display a list of reward roles**\n' +
        '`%%c list`\n\n' +
        '**Add a role**\n' +
        '`%%c add <role> <time>`\n' +
        '`time` works the same way as `duration` for the ban command. A role cannot be added twice.\n\n' +
        '**Remove a role**\n' +
        '`%%c remove <role>`\n\n' +
        '**Enable or disable stacking**\n' +
        '`%%c stacking <enable|disable>`\n' +
        'When this is disabled, every time a user earns a new reward role, they lose previously earned ones. When this is enabled, they get to keep previously earned roles.\n\n' +
        '**Update all user\'s reward roles**\n' +
        '`%%c update`\n' +
        'This command reapplies reward roles to **all users**. In large servers, this can take a very long time. Only use it after making drastic changes to the reward role list! When a user hits a new milestone their roles will automatically be updated, including previously earned roles.',
    'func': async (priv, msg, args, action = '', roleText = '', minutesText = '') => {
        action = action.toLowerCase();
        let role, minutes;
        switch (action) {
            case 'list':
                await dibo.cyborg.rewardroles.list(msg);
                break;
            case 'add':
                role = dibo.tools.textToRole(msg.guild, roleText);
                minutes = dibo.cyborg.moderation.durationTextToMinutes(minutesText);
                if (!role || !minutes) {
                    return false;
                }
                return await add(msg.guild.id, minutes, role.id);
            case 'remove':
                role = dibo.tools.textToRole(msg.guild, roleText);
                if (!role) {
                    return false;
                }
                return await remove(msg.guild.id, role.id);
            case 'update': // todo command to update the roles of all users after making changes to level roles
                await msg.react('🔄');
                dibo.log.info(`${msg.member} started updating all known user's roles based on current reward role configuration.`, undefined, msg.guild.id);
                await update(msg.guild);
                dibo.log.info(`Finished updating user's reward roles.`, undefined, msg.guild.id);
                await msg.reactions.removeAll();
                return true;
            case 'stacking':
                roleText = roleText.toLowerCase();
                switch (roleText) {
                    case 'true':
                    case 'on':
                    case 'enable':
                    case 'enabled':
                    case '1':
                        await dibo.database.setGuildKey(msg.guild.id, 'rewardRolesAccumulate', true);
                        return true;
                    case 'false':
                    case 'off':
                    case 'disable':
                    case 'disabled':
                    case '0':
                        await dibo.database.setGuildKey(msg.guild.id, 'rewardRolesAccumulate', false);
                        return true;
                    default:
                        return false;
                }
            default:
                return dibo.commandHandler.run(msg, priv, 'help', ['activityroles']);
        }

        // let roles = await dibo.database.getGuildKey(msg.guild.id, 'rewardRoles', {});
        // let removeOld = !await dibo.database.getGuildKey(msg.guild.id, 'rewardRolesAccumulate', false);
        // sort like in test.js
    }
}

async function add(guildId, minutes, roleId) {
    let roles = await dibo.database.getGuildKey(guildId, 'rewardRoles', []); //{ role: '1234567890', minutes: 60 }
    for (role of roles) {
        if (role.role === roleId) {
            return false;
        }
    }
    roles.push({'role': roleId, 'minutes': minutes})
    roles = sortRoles(roles);
    await dibo.database.setGuildKey(guildId, 'rewardRoles', roles);
    return true;
}

async function remove(guildId, roleId) {
    let roles = await dibo.database.getGuildKey(guildId, 'rewardRoles', []);
    let index;
    for (index = 0; index < roles.length; index++) {
        if (roles[index].role === roleId) {
            roles.splice(index, 1);
            await dibo.database.setGuildKey(guildId, 'rewardRoles', roles);
            return true;
        }
    }
    return false;
}

async function update(guild) {
    let roles = await dibo.database.getGuildKey(guild.id, 'rewardRoles', []);
    let userId, users = await dibo.database.getUserList(guild.id);
    let accumulation = await dibo.database.getGuildKey(guild.id, 'rewardRolesAccumulate', false);
    for (userId of users) {
        let member = await dibo.tools.textToMember(guild, userId);
        if (member) {
            await dibo.cyborg.rewardroles.doRoleAssignment(guild, member, roles, accumulation);
        }
    }
}

function sortRoles(roles) {
    roles.sort((a, b) => {
        if (a.minutes < b.minutes) {
            return -1;
        } else if (a.minutes > b.minutes) {
            return 1;
        } else {
            return 0;
        }
    });
    return roles;
}
