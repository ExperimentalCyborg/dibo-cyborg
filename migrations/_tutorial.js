/* Scripts in this folder convert older versions of the database and/or settings to newer ones after an update.
* These scripts always run in alphabetical order. Therefore, if they are named after the version number they convert to,
*  they will do the conversions in the right order...
* ... BUT ONLY IF YOU INCLUDE A LEADING ZERO. 1.05 comes before 1.15, but 1.5 comes after 1.15!
*
* Conversion scripts have to check whether they are applicable using the needsMigration() function.
* You can use the template below to make a new migration script. Migrations should always extend libs/baseMigration.
* */

const fs = require('fs');
const Database = require('../libs/database');
const Migration = require('../libs/baseMigration');

module.exports = class extends Migration{
    constructor(log, settings_file_path) {
        super(log, settings_file_path);
    }

    async needsMigration(){
        let isMigrationNeeded;
        // todo: check whether this script is applicable
        isMigrationNeeded = false;

        return isMigrationNeeded;
    }

    async doMigration(){
        // todo: migrate whatever needs migrating

        this.log.info('Migrating settings...');
        //load the settings file, change it, save it
        let settings = JSON.parse(fs.readFileSync(this.settingsfilepath));
        // do stuff with settings
        fs.writeFileSync(this.settingsfilepath, JSON.stringify(settings));
        this.log.info('    OK');

        this.log.info('Migrating database...');
        let db = new Database();
        await db.start(settings['databasefilepath']);
        // do stuff with db
        this.log.info('    OK');
    }
}
