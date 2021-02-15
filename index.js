const fs = require('fs');
const Log = require('./libs/log');
const {ShardingManager} = require('discord.js');
const log = new Log();

let settings_file_path = './settings.json';

// Load and run migrations
async function migrate(){
    log.info('Running migrations...');
    let fileNames = fs.readdirSync('./migrations');
    fileNames = fileNames.filter(fileName => fileName.toLowerCase().endsWith('.js'));
    fileNames = fileNames.filter(fileName => !fileName.startsWith('_'));
    fileNames.sort();
    for(const fileName of fileNames){
        log.info(`... ${fileName}`);
        try {
            const Migration = require(`./migrations/${fileName.slice(0, -3)}`);
            let m = new Migration(log, settings_file_path);
            if(await m.needsMigration()){
                log.info(`... Migrating`);
                await m.doMigration();
                log.info(`... Migrated`);
            }else{
                log.info(`... Not needed`);
            }
        } catch (reason) {
            log.error('Stack trace', reason.stack);
            log.error(`Migration failed due to unhandled exception in migration script "${fileName}"`);
            process.exit(-10);
        }
    }
    log.info('Migrations completed');
}

// Load settings
function loadSettings(){
    let settings;
    try{
        settings = JSON.parse(fs.readFileSync(settings_file_path));
    }catch (error){
        log.error('Failed to load settings', error);
        process.exit(-20);
    }
    return settings;
}

function run(){
    let settings = loadSettings();
    const manager = new ShardingManager('./libs/dibo.js', {token: settings.token});
    process.on('SIGINT', () => manager.respawn = false);
    manager.on('shardCreate', shard => {
        log.info(`Launched shard ${shard.id}`);
    });

    if(settings.debug){
        manager.respawn = false;
    }
    log.info(settings.startupmessage || '========[Starting bot]==========');
    manager.spawn().catch(reason => {
        log.error('Failed to start', reason);
        return -1;
    });
}

log.info('================================');
migrate().then(()=>{
    run();
}).catch(reason => {
    log.error('Stack trace', reason.stack);
    log.error('Migrations failed due to unhandled exception in migration manager');
    process.exit(-11);
});
