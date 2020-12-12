const dibo = require('../libs/dibo');

module.exports = {
    'names': ['purge', 'clean', 'nuke'],
    'privilege': dibo.privilege.MOD,
    'summary': '🚧 Bulk delete messages, optionally with a filter.',
    'help': 'todo',
    'func': async (priv, msg, args, action = '', amount, userText) => {
        await msg.react('🚧'); // todo

        let guildId = msg.guild.id;
        action = action.toLowerCase();

        if (['stop', 'all', 'last', 'user', 'word', 'reactions'].indexOf(action) < 0) {
            return dibo.commandHandler.run(msg, priv, 'help', ['purge']);
        }

        if (action === 'stop') {
            delete dibo.cyborg.purges[guildId]; // clear the purging flag so any async actions abort
            return true;
        }

        if (dibo.cyborg.purges.hasOwnProperty(guildId)) { // make sure we don't start concurrent purges
            dibo.log.error(`Failed to purge ${msg.channel}`,
                `Already purging ${dibo.tools.textToChannel(msg.guild, dibo.cyborg.purges[guildId])}`, guildId);
            return false;
        }

        switch (action) {
            case 'all':
                dibo.cyborg.purges[guildId] = msg.channel.id; // set the "purging in progress" flag
                dibo.log.info(`${msg.author} started the purge of all messages in ${msg.channel}.`, undefined, guildId);
                let failed = false;
                let deletionHistory = [];
                let startTime = Date.now();
                let cache = await msg.channel.messages.fetch({limit: 100}, false, true);
                while (!failed && cache.keyArray().length !== 0) { // bulk delete as much as possible first
                    if (!dibo.cyborg.purges[guildId]) { // stop if the flag is gone
                        return;
                    }

                    await msg.channel.bulkDelete(cache).then(messages => {
                        messages.keyArray().forEach(key => deletionHistory.push(key));
                    }).catch(reason => {
                        failed = true;
                    });
                    cache = await msg.channel.messages.fetch({limit: 100}, false, true); // make sure our cache is fresh
                }

                if (cache.keyArray().length <= 0) {
                    finishBulkDelete(msg.channel, deletionHistory, startTime);
                    return;
                }

                bulkDelete(msg.channel, deletionHistory, startTime); // Delete anything that's left the hard way - one by one.
                dibo.log.info(`Started background purge of ${msg.channel}.`,
                    'Bulk delete was unable to purge all remaining messages. I am now attempting to remove the rest one by one.', guildId);
                break;
            case 'last': // todo functionally merge this with "all" and add an optional amount limit?
                if(!isNumeric(amount)){
                    return false;
                }
                amount = parseInt(amount) + 1;
                if (amount > 100) {
                    amount = 100;
                }
                await msg.channel.messages.fetch({limit: 100}, true, true);
                await msg.channel.bulkDelete(amount, true);
                dibo.log.info(`${msg.author} removed the last ${amount} messages from ${msg.channel}.`, undefined, guildId);
                break;
            case 'user':
                // purge user N user
                break;
            case 'word':
                // purge word N word word word ..
                break;
            case 'reactions':
                break;
        }
    }
}

function bulkDelete(channel, deletionHistory, startTime) { // ugly wrapper to avoid duplicating code
    if (dibo.cyborg.purges.hasOwnProperty(channel.guild.id)) {
        doBulkDelete(channel, deletionHistory, startTime).catch(reason => {
            dibo.log.error(`Failed to purge channel ${channel}`, reason, channel.guild.id);
            delete dibo.cyborg.purges[channel.guild.id];
        });
    } else {
        dibo.log.info(`The purge of ${channel} was cancelled by request after ${timeToText(Date.now() - startTime)}`, undefined, channel.guild.id);
    }
}

function finishBulkDelete(channel, deletionHistory, startTime){
    delete dibo.cyborg.purges[channel.guild.id];
    dibo.log.info(`Finished purging ${channel}. ${deletionHistory.length} messages were removed in ${timeToText(Date.now() - startTime)}.`,
        undefined, channel.guild.id);
}

async function doBulkDelete(channel, deletionHistory = [], startTime, staleSince = -1) {
    let cache = await channel.messages.fetch({limit: 20}, false, true);
    let empty = true;
    staleSince = Date.now();
    cache.each(message => {
        empty = false;
        if (deletionHistory.indexOf(message.id) >= 0) {
            return;
        }
        staleSince = -1; // this is a message we haven't seen before, so the cache wasn't stale.
        deletionHistory.push(message.id); // remember this message
        message.delete().catch(reason => {
            let msgText = message.id;
            try {
                msgText = dibo.tools.makeMsgLink(message);
            } catch {
            } // Could error out due to partial message. Ignore.
            dibo.log.debug(`During the purge of ${channel}, failed to delete message ${msgText}`, reason, channel.guild.id, true);
        });
    });

    if (empty) {
        finishBulkDelete(channel, deletionHistory, startTime);
        return;
    }

    let waitTime = 0;
    if (staleSince > 0 && Date.now() - staleSince >= 5 * 60 * 1000) { // If we've been getting stale info for 5 minutes
        delete dibo.cyborg.purges[channel.guild.id];
        dibo.log.error(`Purge of ${channel} auto-aborted.`,
            `We've been getting stale channel message caches for 5 minutes or longer. Try again later when Discord is less busy.`, channel.guild.id);
        return;
    } else if (staleSince > 0) {
        waitTime = 15000;
        dibo.log.debug(`During the purge of ${channel}, Discord only returned already deleted messages when we asked for more. Waiting ${Math.floor(waitTime / 1000)} seconds until resuming to let Discord catch up.`,
            undefined, channel.guild.id);
    }

    setTimeout(async () => {
        bulkDelete(channel, deletionHistory, startTime);
    }, waitTime);
}

function isNumeric(n) { // todo move to dibo.tools
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function timeToText(milliseconds) { // todo move to dibo.tools
    let date = new Date(0);
    date.setMilliseconds(milliseconds);
    return date.toISOString().substr(11, 8);
}
