const dibo = require('../libs/dibo');
const Discord = require('discord.js');

dibo.client.on('messageDelete', async msg => {
    try{
        await logDeletion(msg);
    }catch (e){
        dibo.log.debug('Failed to log message deletion', e, msg.guild.id);
        if(dibo.settings.debug){
            throw e;
        }
    }
});

dibo.client.on('messageUpdate', async (oldMsg, newMsg) => {
    try{
        await logUpdate(oldMsg, newMsg);
    }catch (e){
        dibo.log.debug('Failed to log message update', e, newMsg.guild.id);
        if(dibo.settings.debug){
            throw e; // todo break out to generic catch-and-log function
        }
    }
});

async function logUpdate(oldMsg, newMsg) {
    if (!await checkMessage(newMsg)) {
        return;
    }
    let oldContent;
    try{
        await oldMsg.fetch(); // checkMessage already fetches the new one
        oldContent = oldMsg.content;
    }catch (e){}

    let editLogChannel = await dibo.database.getGuildKey(newMsg.guild.id, 'editLogChannel');
    if (!editLogChannel) {
        return;
    }
    let channel = dibo.tools.textToChannel(newMsg.guild, editLogChannel);
    let mbed = new Discord.MessageEmbed();
    mbed.setColor("DARK_ORANGE");
    mbed.setTitle('Message Edit');
    mbed.setDescription(newMsg.url);
    if(oldContent === undefined || oldContent === null){
        mbed.addField('Warning', 'Unable to fetch old message contents.', true);
    }else{
        mbed.addField('Old', oldMsg.content, true);
    }
    mbed.addField('New', newMsg.content, true);
    mbed.setFooter(`${await getAuthorName(newMsg.guild, newMsg.author)}`);
    mbed.setTimestamp(newMsg.editedTimestamp);
    await channel.send(mbed);
}

async function logDeletion(msg) {
    if (!await checkMessage(msg)) {
        return;
    }

    let editLogChannel = await dibo.database.getGuildKey(msg.guild.id, 'editLogChannel');
    if (!editLogChannel) {
        return;
    }
    let channel = dibo.tools.textToChannel(msg.guild, editLogChannel);
    let mbed = new Discord.MessageEmbed();
    mbed.setColor("DARK_RED");
    mbed.setTitle('Message Deletion');
    mbed.setDescription(`${msg.channel}`);
    mbed.addField('Content', msg.content, true);
    mbed.setFooter(`${await getAuthorName(msg.guild, msg.member)}`);
    mbed.setTimestamp();
    await channel.send(mbed);
}

async function checkMessage(msg) {
    if (msg.deleted && dibo.cyborg.purges.hasOwnProperty(msg.guild.id) && dibo.cyborg.purges[msg.guild.id] === msg.channel.id) {
        // todo ignore individual messages the bot deleted intentionally (like !report)
        // when a really short purge is done, the purge flag is gone before the deletion events come through.
        return false; // Ignore message deletions from a channel where a purge is going on
    }

    if(msg.deleted && msg.partial){
        return false; // can't fetch deleted partials, dump the message :(
    }

    if(msg.partial){
        try{
            await msg.fetch()
        }catch (e){
            return false; // probably an edit of an older message in a channel where we don't have history permission.
        }
    }
    if(msg.author.partial){
        await msg.author.fetch();
    }
    return !(msg.system || msg.author.bot);
}

async function getAuthorName(guild, author){
    let member = await dibo.tools.textToMember(guild, author.id) // some edited messages don't have a member object
    if(!member){ // no longer on the server
        return author.tag;
    }
    return dibo.tools.memberToText(member);
}
