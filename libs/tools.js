module.exports = class {

    // Accepts a user ID, user mention, or discord user tag (name#1234). Beware this is an async function.
    static async textToMember(guild, text = '') {
        let memberId;

        // Try to interpret text as a member ID
        if(text.match(/^(\d+)$/m) && text <= Math.pow(2, 63)){
            return await guild.members.fetch(text);
        }

        // See if text is a member @mention
        let match = text.match(/^<@!?(\d+)>$/m);
        if (match) {
            memberId = match[1];
        } else { // See if Text is a user tag. Tags may not work for offline users!
            memberId = guild.members.cache.findKey(value => value.user.tag === text);
        }

        if (memberId) { // try to get a member from the id we found
            return await guild.members.fetch(memberId);
        }
        // todo also support nicknames
    }

    // Accepts a channel ID, channel #mention, or a channel name.
    static textToChannel(guild, text = '') {
        let channel, channelId;

        // Try to interpret text as a channel ID
        channel = guild.channels.cache.get(text);
        if (channel) {
            return channel;
        }

        // See if text is a channel mention
        let match = text.match(/^<#(\d+)>$/m);
        if (match) {
            channelId = match[1];
        } else { // See if Text is a channel name
            channelId = guild.channels.cache.findKey(value => value.name.toLowerCase() === text.toLowerCase());
        }

        if (channelId) { // try to get a channel from the id we found
            channel = guild.channels.cache.get(channelId);
            if (channel) {
                return channel;
            }
        }
    }

    // Accepts a role ID, role @mention or role name.
    static textToRole(guild, text = '') {
        let role, roleId;

        // Try to interpret text as a role ID
        role = guild.roles.cache.get(text);
        if (role) {
            return role;
        }

        // See if text is a role mention
        let match = text.match(/^<@&(\d+)>$/m);
        if (match) {
            roleId = match[1];
        } else { // See if Text is a role name
            roleId = guild.roles.cache.findKey(value => value.name.toLowerCase() === text.toLowerCase());
        }

        if (roleId) { // try to get a role from the id we found
            role = guild.roles.cache.get(roleId);
            if (role) {
                return role;
            }
        }
    }

    // Accepts a message URL or message ID.
    static async textToMessage(guild, text = '') {
        let channelId, messageId;
        let match = text.match(/^https:\/\/(?:\S+\.)?discord\.com\/channels\/(?<guild>\d+)\/(?<channel>\d+)\/(?<message>\d+)[\/]?$/);
        if (match && guild.id === match.groups.guild) { // Check for message URL (from the specified guild!)
            channelId = match.groups.channel;
            messageId = match.groups.message;
            return await guild.channels.cache.get(channelId).messages.fetch(messageId);
        } else if (text.match(/^\d+$/)) { // Check for message ID
            messageId = text;
            let message, channel;
            for (channel of guild.channels.cache) {
                channel = channel[1]; // channel is a list of [k,v]
                if (channel.hasOwnProperty('messages')) { // is a text channel or news channel
                    await channel.messages.fetch(messageId).then(value => message = value).catch();
                }
            }
        }
    }

    // Also accepts just a message object!
    static makeMsgLink(guildId, channelId, msgId) {
        if(channelId === undefined && msgId === undefined){
            let message = guildId;
            try{
                guildId = message.guild.id;
                channelId = message.channel.id;
                msgId = message.id;
            }catch (e) {
                return '';
            }
        }
        return `https://discord.com/channels/${guildId}/${channelId}/${msgId}`;
    }

    // Returns [str_summary, str_helptext]
    static getHelpText(dibo_commands, command, prefix) {
        if (!dibo_commands.hasOwnProperty(command)) {
            return [];
        }
        return [
            dibo_commands[command].summary.replace(/%%p/g, prefix),
            dibo_commands[command].help.replace(/%%p/g, prefix)
        ];
    }

    static splitCommandString(commandString) {
        let results = commandString.match(/[\"].+?[\"]|[\'].+?[\']|[^ ]+/sg); // Also recognizes quoted arguments with spaces in them!
        results.forEach((value, index) => {
            if (value.includes(' ')) { // If an argument has spaces it starts and ends with quotes
                results[index] = value.slice(1, -1); // Strip off the quotes
            }
        });
        return results;
    }

    static getRoleName(guild, roleId) {
        try {
            return guild.roles.cache.get(roleId).name;
        } catch (e) {
        }
    }

    static getChannelName(guild, channelId) {
        try {
            return guild.channels.cache.get(channelId).toString();
        } catch (e) {
        }
    }

    static isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    // Converts an amount of milliseconds to a HH:MM:SS string
    static durationToText(milliseconds) {
        let date = new Date(0);
        date.setMilliseconds(milliseconds);
        let timestr = date.toISOString().substr(11, 8);
        let daystr = '';
        let days = Math.floor(milliseconds / 86400000);
        if(days){
            daystr = `${days}d `;
        }
        return `${daystr}${timestr}`;
    }
}
