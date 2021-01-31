const dibo = require('../libs/dibo');
const bnf = require('bonnefooi');

let safeDibo = new bnf(dibo);
safeDibo.cyborg.purges = {};
safeDibo.cyborg.bulkDeleteMessages = startDelete;

async function startDelete(author, channel, limit = 0, filterFunc = undefined){
    let guildId = channel.guild.id;

    dibo.cyborg.purges[guildId] = channel.id; // set the "purging in progress" flag
    let amount = limit || 'all';
    dibo.log.info(`${author} started the purge of ${amount} messages in ${channel}.`, undefined, guildId);

    let deletionHistory = [];
    let startTime = Date.now();
    if(!filterFunc && limit < 0){
        if(!await bulkDelete(channel, deletionHistory, startTime)){
            console.log('a')
            startSlowDelete(channel, deletionHistory, startTime); // Delete anything that's left one by one.
            dibo.log.info(`Started background purge of ${channel}.`,
                'Bulk delete was unable to purge all remaining messages. I am now attempting to remove the rest one by one. This may take a long time!', guildId);
        }
        return;
    }

    if(!filterFunc){
        filterFunc = msg => {
            return true;
        } // filter that matches everything
    }

    startSlowDelete(channel, deletionHistory, startTime, limit, filterFunc);
}

async function bulkDelete(channel, deletionHistory, startTime){
    let failed = false;
    let cache = await channel.messages.fetch({limit: 20}, false, true);
    while (!failed && cache.keyArray().length !== 0) { // bulk delete as much as possible first
        if (!dibo.cyborg.purges[channel.guild.id]) { // stop if the flag is gone
            return;
        }

        await channel.bulkDelete(cache).then(messages => {
            messages.keyArray().forEach(key => deletionHistory.push(key));
        }).catch(reason => {
            dibo.log.debug('Bulk delete failed', reason, channel.guild.id);
            failed = true;
        });
        cache = await channel.messages.fetch({limit: 20}, false, true); // make sure our cache is fresh
    }

    if (cache.keyArray().length <= 0) {
        finishDelete(channel, deletionHistory, startTime);
        return true;
    }

    console.log(deletionHistory);

    return false;
}

function finishDelete(channel, deletionHistory, startTime){
    delete dibo.cyborg.purges[channel.guild.id];
    dibo.log.info(`Finished purging ${channel}. ${deletionHistory.length} messages were removed in ${dibo.tools.durationToText(Date.now() - startTime)}.`,
        undefined, channel.guild.id);
}

function startSlowDelete(channel, deletionHistory, startTime, limit, filterFunc, staleSince = -1) { // ugly wrapper to avoid duplicating code
    if (dibo.cyborg.purges.hasOwnProperty(channel.guild.id)) {
        doSlowDelete(channel, deletionHistory, startTime, limit, filterFunc, staleSince).catch(reason => {
            dibo.log.error(`Failed to purge channel ${channel}`, reason, channel.guild.id);
            delete dibo.cyborg.purges[channel.guild.id];
        });
    } else {
        dibo.log.info(`The purge of ${channel} was cancelled by request after ${dibo.tools.durationToText(Date.now() - startTime)}`, undefined, channel.guild.id);
    }
}

async function doSlowDelete(channel, deletionHistory, startTime, limit, filterFunc, staleSince) {
    let cache = await channel.messages.fetch({limit: 20}, false, true);
    let empty = true;
    let now = Date.now();
    cache.each(message => {
        if(deletionHistory.length >= limit){
            return;
        }
        empty = false;
        if (deletionHistory.indexOf(message.id) >= 0) {
            return;
        }
        staleSince = now; // this is a message we haven't seen before, so the cache wasn't stale.
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

    if (empty || deletionHistory.length >= limit) {
        finishDelete(channel, deletionHistory, startTime);
        return;
    }

    let waitTime = 0;
    if (staleSince > 0 && Date.now() - staleSince >= 5 * 60 * 1000) { // If we've been getting stale info for 5 minutes
        delete dibo.cyborg.purges[channel.guild.id];
        dibo.log.warn(`Purge of ${channel} auto-aborted.`,
            `We've been getting stale channel message caches for 5 minutes or longer. Try again later when Discord is less busy.`, channel.guild.id);
        return;
    } else{
        waitTime = 15000;
        dibo.log.debug(`During the purge of ${channel}, Discord only returned already deleted messages when we asked for more. Waiting ${Math.floor(waitTime / 1000)} seconds until resuming to let Discord catch up.`,
            undefined, channel.guild.id);
    }

    setTimeout(async () => {
        startSlowDelete(channel, deletionHistory, startTime, limit, filterFunc, staleSince);
    }, waitTime);
}