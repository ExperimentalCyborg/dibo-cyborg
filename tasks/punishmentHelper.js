const Discord = require('discord.js');
const dibo = require('../libs/dibo');
const bnf = require('bonnefooi');

const TYPE_MUTE = 'muted';
const TYPE_UNMUTE = 'unmuted';
const TYPE_BAN = 'banned';
const TYPE_UNBAN = 'unbanned';
const TYPE_KICK = 'kicked or left';
const TYPE_WARN = 'warned';
const TYPE_REPORT = 'reported';
const TYPE_JOIN = 'joined';
const TYPE_NOTE = 'noted';

//const punishmentReversionCheckInterval = 60000;
const punishmentReversionCheckInterval = 10000; // todo remove debug stuff

// Make the punishment helper functions available in the dibo object
let safeDibo = new bnf(dibo);
safeDibo.cyborg.moderation.warn = warn;
safeDibo.cyborg.moderation.ban = ban;
safeDibo.cyborg.moderation.unban = unban;
safeDibo.cyborg.moderation.mute = mute;
safeDibo.cyborg.moderation.unmute = unmute;
safeDibo.cyborg.moderation.report = report;
safeDibo.cyborg.moderation.durationTextToMinutes = durationTextToMinutes;

dibo.client.on('ready', () => {
    setInterval(async () => {
        await checkExpiredPunishments().catch(reason => dibo.log.error('Failed to check for expired punishments', reason));
    }, punishmentReversionCheckInterval);
})


// Events related to moderation actions

dibo.client.on('guildMemberRemove', async member => {
    await updateOrAddExternal(member.guild.id, member.id, TYPE_KICK); // note: useless until we have a kick command
});

dibo.client.on('guildBanAdd', async (guild, user) => {
    await updateOrAddExternal(guild.id, user.id, TYPE_BAN, true);
});

dibo.client.on('guildBanRemove', async (guild, user) => {
    await updateOrAddExternal(guild.id, user.id, TYPE_UNBAN, true);

    // When someone is (manually) unbanned, remove their temp ban from the list.
    try {
        let bans = await dibo.database.getGuildKey(guild.id, 'tempBans', {});
        if (!bans.hasOwnProperty(user.id)) {
            return;
        }
        delete bans[user.id]
        await dibo.database.setGuildKey(guild.id, 'tempBans', bans);
    } catch (error) {
        dibo.log.error('Failed to remove possible temp ban', error, guild.id);
    }
});

dibo.client.on('guildMemberUpdate', async (oldMember, newMember) => {
    // When someone's mute role is (manually) removed, remove their temp mute from the list.
    try {
        let guildId = newMember.guild.id;
        let muteRole = await dibo.database.getGuildKey(guildId, 'muteRole');
        if (!muteRole) {
            return;
        }

        oldMember.fetch();
        newMember.fetch();
        // todo register (un)mute in their record
        if (oldMember.roles.cache.keyArray().indexOf(muteRole) < 0 && newMember.roles.cache.keyArray().indexOf(muteRole) >= 0) { // muted
            await updateOrAddExternal(newMember.guild.id, newMember.id, TYPE_MUTE, true);
        }else if (oldMember.roles.cache.keyArray().indexOf(muteRole) >= 0 && newMember.roles.cache.keyArray().indexOf(muteRole) < 0) { // unmuted
            await updateOrAddExternal(newMember.guild.id, newMember.id, TYPE_UNMUTE, true);

            //update temp mutes list
            let mutes = await dibo.database.getGuildKey(guildId, 'tempMutes', {});
            if (!mutes.hasOwnProperty(newMember.id)) {
                return;
            }
            delete mutes[newMember.id]
            await dibo.database.setGuildKey(guildId, 'tempMutes', mutes);
        }
    } catch (error) {
        dibo.log.error('Failed to remove possible temp mute', error, newMember.guild.id);
    }
});

async function checkExpiredPunishments() {
    let reasonText = 'Limited time punishment has expired';
    let guilds = await dibo.database.getGuildList();
    for (let guildId of guilds) {
        let changed = false;
        let guild;
        try{
            guild = await dibo.client.guilds.fetch(guildId);
        }catch (e){
            if(dibo.debugMode){
                dibo.log.debug("Expired punishment check tried to fetch guild we don't have access to", undefined, guildId);
            }
            continue;
        }

        let bans = await dibo.database.getGuildKey(guildId, 'tempBans', {});
        for (let memberId of Object.keys(bans)) {
            if (bans[memberId] <= Date.now()) {
                await unban(dibo.client.user, guildId, memberId, reasonText);
            }
        }

        changed = false;
        let mutes = await dibo.database.getGuildKey(guildId, 'tempMutes', {});
        for (let memberId of Object.keys(mutes)) {
            if (mutes[memberId] <= Date.now()) {
                let member = await dibo.tools.textToMember(guild, memberId);
                await unmute(dibo.client.user, member, reasonText);
            }
        }
    }
}

// Functions for moderation actions

async function warn(author, member, reason = 'No reason specified') {
    if(dibo.client.user.id === member.id){
        dibo.log.warn(`${author} tried to warn me.`, undefined, member.guild.id);
        return false;
    }

    await addRecord(member.guild.id, member.id, TYPE_WARN, author.id, reason);
    // todo auto-punish on x warnings within y time should trigger here
    dibo.log.info(`${member} was warned by ${author}`, reason, member.guild.id);
    await member.send(`\`${member.guild}\` warns you: ${reason}\nToo many warnings can result in punishment.`).catch(()=>{});
    return true;
}

// Mute someone. Duration is in minutes. If it's something other than an integer > 0, the punishment will be permanent.
async function mute(author, member, reason = 'No reason specified', duration) {
    if(author.id === member.id){
        dibo.log.warn(`${author} tried to mute themselves.`, undefined, member.guild.id);
        return false;
    }

    if(dibo.client.user.id === member.id){
        dibo.log.warn(`${author} tried to mute me.`, undefined, member.guild.id);
        return false;
    }

    let success = true;
    let errorText = `${author} failed to mute ${member} for "${reason}"`;
    let muteRole = await dibo.database.getGuildKey(member.guild.id, 'muteRole');
    if (!muteRole) {
        dibo.log.warn(errorText, 'No mute role is configured', member.guild.id);
        return false;
    }

    let durationText = 'permanently'
    if (duration && dibo.tools.isNumeric(duration)) {
        durationText = `for ${dibo.tools.durationToText(duration * 60 * 1000)}`;
    }

    await addRecord(member.guild.id, member.id, TYPE_MUTE, author.id, reason, duration);
    await member.roles.add(muteRole).then(async () => {
        dibo.log.info(`${author} muted ${member} ${durationText}`, reason, member.guild.id);

        if (durationText !== 'permanently') { // add to temp mutes list
            let mutes = await dibo.database.getGuildKey(member.guild.id, 'tempMutes', {});
            let endTime = Date.now() + duration * 60 * 1000; // store end date as a timestamp in milliseconds
            if (!(mutes[member.id] > endTime)) { // if no longer temp mute exists
                mutes[member.id] = endTime;
                await dibo.database.setGuildKey(member.guild.id, 'tempMutes', mutes);
            }
        }
        await member.send(`You are muted in \`${member.guild}\` ${durationText}. Reason:\n> ${reason}`).catch(()=>{});
    }).catch(error => {
        dibo.log.error(errorText, error, member.guild.id);
        success = false;
    });
    return success;
}

async function unmute(author, member, reason = 'No reason specified') {
    if(author.id === member.id){
        dibo.log.warn(`${author} tried to unmute themselves.`, undefined, member.guild.id);
        return false;
    }
    let success = true;
    let errorText = `${author} failed to unmute ${member} for "${reason}"`;
    let muteRole = await dibo.database.getGuildKey(member.guild.id, 'muteRole');
    if (!muteRole) {
        dibo.log.warn(errorText, 'No mute role is configured, i don\'t know which role to remove!', member.guild.id);
        return false;
    }

    await addRecord(member.guild.id, member.id, TYPE_UNMUTE, author.id, reason);
    await member.roles.remove(muteRole).then(async () => {
        dibo.log.info(`${author} unmuted ${member}`, reason, member.guild.id);
        // remove temp mute record if it exists
        let mutes = await dibo.database.getGuildKey(member.guild.id, 'tempMutes', {});
        delete mutes[member.id];
        await dibo.database.setGuildKey(member.guild.id, 'tempMutes', mutes);
        await member.send(`You are unmuted in \`${member.guild}\`. Reason:\n> ${reason}`).catch(()=>{});
    }).catch(error => {
        dibo.log.error(errorText, error, member.guild.id);
        success = false;
    });
    return success;
}

// Ban someone. Duration is in minutes. If it's something other than an integer > 0, the punishment will be permanent.
// Author needs to be a member object!
async function ban(author, member, duration, reason = 'No reason specified') {
    if(author.id === member.id){
        dibo.log.warn(`${author} tried to ban themselves.`, undefined, member.guild.id);
        return false;
    }

    if(dibo.client.user.id === member.id){
        dibo.log.warn(`${author} tried to ban me.`, undefined, member.guild.id);
        return false;
    }

    if(await dibo.checkPrivilege(author) === dibo.privilege.MOD){
        let memberPriv = await dibo.checkPrivilege(member);
        if(memberPriv !== dibo.privilege.USER){
            dibo.log.warn(`${author} tried to ban ${memberPriv} ${member}.`, undefined, member.guild.id);
            return false;
        }
    }

    let success = true;
    let errorText = `${author} failed to ban ${member} for "${reason}"`;

    let durationText = 'permanently'
    if (duration && dibo.tools.isNumeric(duration) && duration > 0) {
        durationText = `for ${dibo.tools.durationToText(duration * 60 * 1000)}`;
    }

    await addRecord(member.guild.id, member.id, TYPE_BAN, author.id, reason, duration);
    await member.ban({'reason': reason}).then(async () => {
        dibo.log.info(`${author} banned ${member} ${durationText}`, reason, member.guild.id);

        if (durationText !== 'permanently') { // add to temp ban list
            let bans = await dibo.database.getGuildKey(member.guild.id, 'tempBans', {});
            let endTime = Date.now() + duration * 60 * 1000; // store end date as a timestamp in milliseconds
            if (!(bans[member.id] > endTime)) { // if no longer temp ban exists
                bans[member.id] = endTime;
                await dibo.database.setGuildKey(member.guild.id, 'tempBans', bans);
            }
        }
        await member.send(`You are banned from \`${member.guild}\` ${durationText}. Reason:\n> ${reason}`).catch(()=>{});
    }).catch(error => {
        dibo.log.error(errorText, error, member.guild.id);
        success = false;
    });
    return success;
}

async function unban(author, guildId, memberId, reason = 'No reason specified') {
    if(author.id === memberId){
        return false;
    }
    let success = true;
    let guild;
    let errorText = `${author} failed to unban ${memberId} for "${reason}"`;
    try{
        guild = await dibo.client.guilds.fetch(guildId);
    }catch (e){
        dibo.log.warn(errorText, `I don't have access to this guild: ${guildId}`);
        return;
    }

    await addRecord(guildId, memberId, TYPE_UNBAN, author.id, reason);
    await guild.members.unban(memberId).then(async ()=>{
            dibo.log.info(`${author} unbanned ${memberId}`, reason, guildId);
            // remove temp ban record if it exists
            let bans = await dibo.database.getGuildKey(guildId, 'tempBans', {});
            delete bans[memberId];
            await dibo.database.setGuildKey(guildId, 'tempBans', bans);
    }).catch(reason1 => {
        dibo.log.error(errorText, reason1, guildId);
        success = false;
    });
    return success;
}

async function report(author, member, reason = 'No reason specified') {
    await author.send(`In \`${member.guild}\`, you reported ${member.user} for: ${reason}`);
    try {
        let recordReason = `${reason}\nReporter: ${author}`;
        await addRecord(member.guild.id, member.id, TYPE_REPORT, author.id, recordReason, undefined, true).catch(async reason1 => {
            dibo.log.error(`Failed to store report from ${author} about ${member}, contents ${reason}`, reason1, member.guild.id);
            await author.send('Due to an internal error, i was unable to record this report in my database. I will try my best to alert server staff.');
        });

        let reportChannel = await dibo.database.getGuildKey(member.guild.id, 'reportChannel');
        reportChannel = dibo.tools.textToChannel(member.guild, reportChannel);
        if (!reportChannel) {
            reportChannel = await dibo.database.getGuildKey(member.guild.id, 'logChannel');
            reportChannel = dibo.tools.textToChannel(member.guild, reportChannel);
            if (!reportChannel) {
                await author.send(`Unfortunately, \`${member.guild}\` has not configured a way to receive reports. Consider contacting server staff manually.
Stay safe.`);
                return;
            }
        }

        let mbed = new Discord.MessageEmbed();
        mbed.setTitle('Report');
        mbed.setDescription(`Reporter: ${author}\nSubject: ${member}`);
        mbed.addField('Description:', reason);
        mbed.setColor('LUMINOUS_VIVID_PINK');
        mbed.setTimestamp();
        await reportChannel.send(mbed).then(() => {
            author.send(`The report was successfully delivered to \`${member.guild}\`.`);
        });
    } catch (error) {
        await author.send(`Unfortunately, i failed to deliver your report to \`${member.guild}\`. Consider contacting server staff manually.
Stay safe.`);
        dibo.log.error(`Failed to process a report from ${author} about ${member}, contents "${reason}"`, error, member.guild.id);
        throw error;
    }
}

// Utility functions

// Used in event listeners to verify previous actions and record manual mutes/unmutes
async function updateOrAddExternal(guildId, userId, type, add = false){
    try{
        let record = await dibo.database.getUserKey(guildId, userId, 'record', []);
        let lastRecord = record[record.length - 1];
        if(lastRecord && lastRecord['type'] === type && lastRecord['verified'] === false){ // verify the last action
            lastRecord['verified'] = true;
            await dibo.database.setUserKey(guildId, userId, 'record', record);
        }else if(add){
            await addRecord(guildId, userId, type, '', 'External event, check the audit log for details', undefined, true);
        }
    }catch (error){
        dibo.log.error(`Failed to record event ${type} for user ${userId}`, error, guildId);
    }
}

// Add an action to a user's permanent record. Duration is in minutes.
async function addRecord(guildId, memberId, type = TYPE_NOTE, authorId, reason, duration, verified = false) {
    let record = await dibo.database.getUserKey(guildId, memberId, 'record', []);
    record.push({
        'timestamp': Date.now(),
        'type': type,
        'author': authorId,
        'reason': reason,
        'duration': duration,
        'verified': verified //whether or not i have seen a corresponding event to confirm this action (like guildBanAdd/guildBanRemove)
    });
    await dibo.database.setUserKey(guildId, memberId, 'record', record);
}

// accepts an integer string ending in "d", "h", "m" or nothing.
// returns an integer in minutes.
function durationTextToMinutes(durationText){
    durationText = durationText.toLowerCase();
    let duration;
    if(durationText.endsWith('h')){
        durationText = durationText.slice(0, -1);
        duration = parseInt(durationText) * 60;
    }else if(durationText.endsWith('d')){
        durationText = durationText.slice(0, -1);
        duration = parseInt(durationText) * 60 * 24;
    }else if(durationText.endsWith('m')){
        durationText = durationText.slice(0, -1);
        duration = parseInt(durationText)
    }else{
        duration = parseInt(durationText)
    }
    return duration;
}
