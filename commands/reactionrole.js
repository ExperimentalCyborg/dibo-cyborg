const dibo = require('../libs/dibo');

module.exports = {
    'names': ['reactionrole', 'rr'],
    'privilege': dibo.privilege.ADMIN,
    'summary': 'Manage reaction roles.',
    'help': 'Reaction roles are special reaction emoji that grant anyone who clicks them a specified role.\n' +
        '\n' +
        '**Show a list of reaction roles:**\n' +
        '`%%preactionrole list`\n' +
        '\n' +
        '**Add a new reaction role:**\n' +
        '`%%preactionrole add <target> <emoji> <role> [message_text]`\n' +
        'If `target` is a channel rather than a message, a new message will be posted to that channel. If `message_text` is empty, a standard text will be used.\n' +
        '\n' +
        '**Remove a reaction role:**\n' +
        '`%%preactionrole remove <message> [emoji]`\n' +
        'If emoji is omitted, all reaction roles will be removed from that message.',
    'func': async (priv, msg, args, action = '', target = '', emoji, roleText = '', content = '') => { //todo
        let guild = msg.guild;
        let success = false;
        switch (action.toLowerCase()) {
            case 'add':
                let role = dibo.tools.textToRole(guild, roleText);
                if (!role) {
                    return false;
                }
                let channel = dibo.tools.textToChannel(guild, target);
                if (channel) {
                    // Prepare contents for the reaction role message
                    if (!content) {
                        content = `React with ${emoji} to get ${role.name}.`;
                    } else {
                        content = args.slice(4).join(' ');
                    }

                    // Send the reaction role message and add the reaction role to it
                    await channel.send(content).then(async reactMsg => {
                        await reactMsg.react(emoji).then(async () => {
                            await addReactionRole(dibo.database, guild, reactMsg, role.id, emoji);
                            dibo.log.info(`${msg.author} added reactionrole ${emoji} = \`${role.name}\` to ${dibo.tools.makeMsgLink(reactMsg)}`, undefined, guild.id);
                            success = true;
                        }).catch(async reason => { // failed to add reaction emoji :(
                            await reactMsg.delete();
                            dibo.log.info(`Failed to add reaction ${emoji} for role \`${role.name}\` to ${dibo.tools.makeMsgLink(reactMsg)}`, reason, guild.id);
                        });
                    });
                    return success;
                } else { // It's not a channel, so let's assume it's a message
                    await dibo.tools.textToMessage(guild, target).then(async message => {
                        await message.react(emoji);
                        await addReactionRole(dibo.database, guild, message, role.id, emoji);
                        dibo.log.info(`${msg.author} added reactionrole ${emoji} = \`${role.name}\` to ${dibo.tools.makeMsgLink(message)}`, undefined, guild.id);
                        success = true;
                    });
                }
                return success;
            case 'remove':
                let message = await dibo.tools.textToMessage(guild, target);
                await removeReactionRole(dibo.database, msg.guild, message, emoji).then(() => {
                    success = true
                    dibo.log.info(`${msg.author} removed reactionrole ${emoji} from ${dibo.tools.makeMsgLink(message)}`, undefined, guild.id);
                });
                return success;
            case 'list':
                await dibo.cyborg.fetchReactionRoleMessages(guild.id);
                let reactionroles = await dibo.database.getGuildKey(guild.id, 'reactionRoles', {});
                let msglink, empty = true, response = 'Current reaction roles:';
                Object.keys(reactionroles).forEach(msgId => {
                    empty = false;
                    msglink = dibo.tools.makeMsgLink(guild.id, reactionroles[msgId].channel, msgId);
                    response += `\n${msglink}`;
                    Object.keys(reactionroles[msgId]['roles']).forEach(emoji => {
                        let rolename = dibo.tools.getRoleName(guild, reactionroles[msgId]['roles'][emoji]);
                        response += `\n    ${emoji} = ${rolename}`;
                    });
                });
                if (empty) {
                    response = 'No reaction roles configured.';
                }
                await msg.reply(response, {'disableMentions': 'all'});
                break;
            default:
                return dibo.commandHandler.run(msg, priv, 'help', ['reactionrole']);
        }
    }
}

async function addReactionRole(db, guild, msg, roleId, emoji) {
    msg.fetch();
    let msgId = msg.id;
    let guildId = guild.id;
    let channelId = msg.channel.id;
    let reactionRoles = await db.getGuildKey(guildId, 'reactionRoles', {});

    if (!reactionRoles[msgId]) {
        reactionRoles[msgId] = {};
    }

    reactionRoles[msgId]['channel'] = channelId;

    if (!reactionRoles[msgId]['roles']) {
        reactionRoles[msgId]['roles'] = {};
    }

    reactionRoles[msgId]['roles'][emoji] = roleId;
    await db.setGuildKey(guildId, 'reactionRoles', reactionRoles);
}

async function removeReactionRole(db, guild, msg, emoji) {
    let msgId = msg.id;
    let guildId = guild.id;
    let reactionRoles = await db.getGuildKey(guildId, 'reactionRoles');

    if (!reactionRoles[msgId]) {
        return;
    }

    if (emoji) {
        if (reactionRoles[msgId]['roles'].hasOwnProperty(emoji)) {
            delete reactionRoles[msgId]['roles'][emoji];
        }

        if (Object.keys(reactionRoles[msgId]['roles']).length < 1) {
            delete reactionRoles[msgId];
        }
    } else {
        if (reactionRoles.hasOwnProperty(msgId)) {
            delete reactionRoles[msgId];
        }
    }

    await db.setGuildKey(guildId, 'reactionRoles', reactionRoles);
}
