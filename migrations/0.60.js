const fs = require('fs');
const Database = require('../libs/database');
const Migration = require('../libs/baseMigration');

module.exports = class extends Migration{
    constructor(log, settings_file_path) {
        super(log, settings_file_path);
        this.settings = JSON.parse(fs.readFileSync(this.settingsfilepath));
    }

    async needsMigration(){
        return this.settings['version'] === '0.5';
    }

    async doMigration(){
        this.log.info('Migrating settings...');
        if(this.settings.hasOwnProperty('databaseFilePath')){
            this.settings['databasefilepath'] = this.settings['databaseFilePath'];
            delete this.settings['databaseFilePath'];
        }
        this.settings['version'] = '0.60';
        fs.writeFileSync(this.settingsfilepath, JSON.stringify(this.settings, undefined, 4));
        this.log.info('    OK');

        this.log.info('Migrating database...');
        let db = new Database();
        await db.start(this.settings['databasefilepath']);
        let guilds = await db.getGuildList();
        for(let guildId of guilds){
            let restrictions = await db.getGuildKey(guildId, 'channelRestrictions');
            if(restrictions){
                if(restrictions['type'] === 'whitelist'){
                    restrictions['type'] = 'allow';
                }else if(restrictions['type'] === 'blacklist'){
                    restrictions['type'] = 'deny';
                }
                await db.setGuildKey(guildId, 'channelRestrictions', restrictions);
            }

        }
        db.exit();
        this.log.info('    OK');
    }
}
