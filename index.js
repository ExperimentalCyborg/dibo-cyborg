const fs = require('fs');
const Log = require('./libs/log');
const {ShardingManager} = require('discord.js');
const log = new Log();

let settings;
try{
    settings = JSON.parse(fs.readFileSync('./settings.json'));
}catch (error){
    log.error('Failed to load settings', error);
    process.exit(-1);
}

const manager = new ShardingManager('./libs/dibo.js', {token: settings.token});

function exit(){
    manager.respawn = false;
}

process.on('SIGINT', exit);
manager.on('shardCreate', shard => {
    log.info(`Launched shard ${shard.id}`);
});

if(settings.debug){
    manager.respawn = false;
}
log.info(settings.startupMessage || '========[Starting bot]==========');
manager.spawn().catch(reason => {
    log.error('Failed to start', reason);
});
