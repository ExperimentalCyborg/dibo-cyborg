const dibo = require('../libs/dibo');
const bnf = require('bonnefooi');
const Discord = require('discord.js');


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
        'When this is disabled, every time a user earns a new reward role, they lose previously earned ones. When this is enabled, they get to keep previously earned roles.',
    'func': async (priv, msg, args, action = '', roleText = '', minutesText = '') => {
        action = action.toLowerCase();
        let role, minutes;
        switch (action) {
            case 'list':
                await list(msg);
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
                return false;
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
        if(role.role === roleId){
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

async function update(guildId) {
    let rewardRoles = await dibo.database.getGuildKey(guildId, 'rewardRoles', []);
    // stuff
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

async function list(msg){
    let roles = await dibo.database.getGuildKey(msg.guild.id, 'rewardRoles', []);
    let accumulation = await dibo.database.getGuildKey(msg.guild.id, 'rewardRolesAccumulate', false);
    let listText = "";
    for (role of roles) {
        listText += `\n${dibo.tools.durationToText(role.minutes * 60 * 1000)} ➡️ ${dibo.tools.textToRole(msg.guild, role.role)}`
    }

    let mbed = new Discord.MessageEmbed();
    mbed.setTitle(`List of reward roles`);
    mbed.addField('Role stacking', accumulation ? 'Enabled' : 'Disabled');
    mbed.addField('Roles', listText || 'No roles configured.');
    mbed.setFooter(`Requested by ${dibo.tools.memberToText(msg.member)})`);
    msg.reply(mbed);
}

let safeDibo = new bnf(dibo);
safeDibo.cyborg.rewardroles.list = list;
