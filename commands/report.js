const dibo = require('./../libs/dibo');

module.exports = {
    'names': ['report'],
    'privilege': dibo.privilege.USER,
    'bypassRestrictions': true, // Users can use this command even in blacklisted channels.
    'summary': 'Report a user to the staff.',
    'help': `Report someone like this:
\`%%c <user> text about why you reported this user\`
\`<user>\` can be a tag: \`usernametag#1234\`, an ID: \`12345678890\`, or a \`@mention\` (not recommended).

For example: 
\`%%preport Cyborg#7419 attempts at world domination\``,
    'func': async (priv, msg, args, member) => {
        await msg.delete();
        member = await dibo.tools.textToMember(msg.guild, member);
        if(!member){
            let prefix = await dibo.getPrefix(msg.guild.id);
            let helptext = dibo.tools.getHelpText(dibo.commands, 'report', prefix)[1];
            msg.author.send(`Your report in \`${msg.guild}\` did not contain a valid user.\n\n ${helptext}`);
            return;
        }
        await dibo.cyborg.moderation.report(msg.author, member, `${args.slice(1).join(' ')}\nIn channel: ${msg.channel}`);
    }
}
