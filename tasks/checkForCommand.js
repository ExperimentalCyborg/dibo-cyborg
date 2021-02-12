const dibo = require('../libs/dibo');
const Discord = require('discord.js');

async function checkPrivilege(member){
    let privilege;
    let perms = member.permissions;
    let roles = member.roles.cache.keyArray();
    let modRole = await dibo.database.getGuildKey(member.guild.id, 'modRole');
    if (perms.has(Discord.Permissions.FLAGS.ADMINISTRATOR)) {
        privilege = dibo.privilege.ADMIN;
    } else {
        roles.forEach(role => {
            if (role === modRole) {
                privilege = dibo.privilege.MOD;
            }
        })
        if (!privilege) {
            privilege = dibo.privilege.USER;
        }
    }
    return privilege;
}

dibo['checkPrivilege'] = checkPrivilege;

dibo.client.on('message', async msg => {
    if (msg.partial || msg.author.system || msg.author.bot || !msg['guild']) {
        return;
    }

    let content;
    let prefix = await dibo.getPrefix(msg.guild.id);

    if (msg.content.startsWith(prefix)) { // prefix detection
        content = msg.content.slice(prefix.length);
    } else {
        if(msg.content.startsWith(`<@!${dibo.client.user.id}>`)){ // mention detection
            content = msg.content.replace(`<@!${dibo.client.user.id}>`, '').trim();
        }else{
            return false;
        }
    }

    let command, params, split_message
    split_message = dibo.tools.splitCommandString(content);
    command = split_message[0];
    params = split_message.slice(1);

    if(!command){
        return false;
    }

    await dibo.commandHandler.run(msg, await checkPrivilege(msg.member), command.toLowerCase(), params);
});
