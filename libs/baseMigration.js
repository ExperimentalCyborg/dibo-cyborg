module.exports = class {
    constructor(logger, settings_file_path) {
        this.log = logger;
        this.settingsfilepath = settings_file_path;
    }

    async needsMigration(){}
    async doMigration(){}
}
