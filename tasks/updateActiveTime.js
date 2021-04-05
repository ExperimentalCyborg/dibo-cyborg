const dibo = require('../libs/dibo');
const bnf = require('bonnefooi');
const Discord = require('discord.js');

dibo.client.on('message', async msg => {
    if (msg.partial || msg.author.system || msg.author.bot || !msg['guild']) {
        return;
    }

    // award activity points

    let lastMsgSent, activeMinutes;
    try {
        lastMsgSent = await dibo.database.getUserKey(msg.guild.id, msg.member.id, 'lastMsgSent', 0);
        activeMinutes = await dibo.database.getUserKey(msg.guild.id, msg.member.id, 'activeMinutes', 0);
    } catch (reason) {
        dibo.log.error(`Failed to get user active time data from database for ${await dibo.tools.textToMember(msg.author.id)}`,
            reason, msg.guild.id);
        return;
    }

    let errorText = `Failed to save user active time data to database for ${msg.author}`;
    if (timestampToMinutes(lastMsgSent) < timestampToMinutes(msg.createdTimestamp)) {
        activeMinutes += 1;
        await dibo.database.setUserKey(msg.guild.id, msg.member.id, 'activeMinutes', activeMinutes).catch(reason => dibo.log.error(errorText, reason, msg.guild.id));
    }
    lastMsgSent = msg.createdTimestamp;
    await dibo.database.setUserKey(msg.guild.id, msg.member.id, 'lastMsgSent', lastMsgSent).catch(reason => dibo.log.error(errorText, reason, msg.guild.id));

    // apply level roles if any

    let roles = await dibo.database.getGuildKey(msg.guild.id, 'rewardRoles', []);
    for (role of roles) { //{ role: '1234567890', minutes: 60 }
        if (role.minutes === activeMinutes) {
            let accumulation = await dibo.database.getGuildKey(msg.guild.id, 'rewardRolesAccumulate', false);
            await doRoleAssignment(msg.guild, msg.member, roles, accumulation);
        }
    }
});

function timestampToMinutes(timestamp) {
    return Math.floor((timestamp / 1000) / 60)
}

async function doRoleAssignment(guild, member, roles, accumulation) { // todo somehow gives roles that arent earned
    await member.fetch(true).catch(reason => {
        dibo.log.error(`While updating reward role assignments, failed to fetch user ${member}`, reason, guild.id);
    });
    if (member.partial) {
        return;
    }

    let activeMinutes = await dibo.database.getUserKey(guild.id, member.id, 'activeMinutes', 0);
    let lastEarned, role, roleConfig = {};

    for (role of roles) { //{ role: '1234567890', minutes: 60 }
        if (role.minutes <= activeMinutes) {
            if (accumulation) {
                roleConfig[role.role] = true;
            } else {
                roleConfig[role.role] = false;
                lastEarned = role.role;
            }
        } else if (role.minutes > activeMinutes) {
            roleConfig[role.role] = false;
        }
    }

    if (lastEarned) {
        roleConfig[lastEarned] = true;
    }

    for (role in roleConfig) {
        // todo once user role cache is reliable, don't do the mutations unless required.
        //  Currently the cache does not seem to reflect recent changes immediately.
        if (!roleConfig.hasOwnProperty(role)) {
            continue;
        }

        if (roleConfig[role]) {
            await member.roles.add(role).then(() => {
                dibo.log.debug(`Reward role assigned ${dibo.tools.textToRole(guild, role)} to ${member}`, undefined, guild.id);
            }).catch(reason => {
                dibo.log.debug(`Failed to assign reward role ${dibo.tools.textToRole(guild, role)} to ${member}`, reason, guild.id);
            });
        } else {
            await member.roles.remove(role).then(() => {
                dibo.log.debug(`Reward role revoked ${dibo.tools.textToRole(guild, role)} from ${member}`, undefined, guild.id);
            }).catch(reason => {
                dibo.log.debug(`Failed to revoke reward role ${dibo.tools.textToRole(guild, role)} from ${member}`, reason, guild.id);
            });
        }
    }
}

async function list(msg) {
    let roles = await dibo.database.getGuildKey(msg.guild.id, 'rewardRoles', []);
    let accumulation = await dibo.database.getGuildKey(msg.guild.id, 'rewardRolesAccumulate', false);
    let role, listText = "";
    for (role of roles) {
        listText += `\n${dibo.tools.durationToText(role.minutes * 60 * 1000)} > ${dibo.tools.textToRole(msg.guild, role.role)}`
    }

    let mbed = new Discord.MessageEmbed();
    mbed.setTitle(`List of reward roles`);
    mbed.addField('Role stacking', accumulation ? 'Enabled' : 'Disabled');
    mbed.addField('Roles', listText ? `**Active time > Role**${listText}` : 'No roles configured.');
    mbed.setFooter(`Requested by ${dibo.tools.memberToText(msg.member)})`);
    msg.reply(mbed);
}

let safeDibo = new bnf(dibo);
safeDibo.cyborg.rewardroles.list = list;
safeDibo.cyborg.rewardroles.doRoleAssignment = doRoleAssignment;
