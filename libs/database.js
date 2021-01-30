const sqlite3 = require('sqlite3').verbose();

module.exports = class Database {
    constructor() {
        this.db = undefined;
    }

    // Initialize the database
    async start(filePath) {
        this.db = new sqlite3.Database(filePath);
        await this.check_structure();
    }

    // Create the tables if they don't exist yet
    async check_structure() {
        await run(this.db, "SELECT * FROM `guildKeys` LIMIT 1;").catch(async error => {
            await run(this.db, "CREATE TABLE `guildKeys` (`guildId` TEXT NOT NULL, `key` TEXT NOT NULL, `value` TEXT, PRIMARY KEY (`guildId`, `key`));");
        });

        await run(this.db, "SELECT * FROM `userKeys` LIMIT 1;").catch(async error => {
            await run(this.db, "CREATE TABLE `userKeys` (`userId` TEXT NOT NULL, `guildId` TEXT NOT NULL, `key` TEXT NOT NULL, `value` TEXT, PRIMARY KEY (`userId`,`guildId`, `key`));");
        });
    }

    // Gracefully exit
    exit() {
        if (this.db) {
            this.db.close();
        }
    }

    async getGuildList() {
        let result = [];
        let query = "SELECT DISTINCT `guildId` FROM `guildKeys`;";
        await all(this.db, query).then(async rows => {
            if (rows) {
                rows.forEach(row => {
                    result.push(row.guildId);
                })
            }
        });
        return result;
    }

    async getUserList(guildId) {
        let result = [];
        let query = "SELECT DISTINCT `userId` FROM `userKeys` WHERE `guildId` = ?;";
        await all(this.db, query, [guildId]).then(async rows => {
            if (rows) {
                rows.forEach(row => {
                    result.push(row.userId);
                })
            }
        });
        return result;
    }

    async getGuildKey(guildId, key, defaultValue) {
        let result;
        let query = "SELECT `value` FROM `guildKeys` WHERE `guildId` = ? AND `key` = ?";
        await get(this.db, query, [guildId, key]).then(async row => {
            if (!row) {
                if (defaultValue !== undefined) {
                    await this.setGuildKey(guildId, key, defaultValue);
                }
                result = defaultValue;
            } else {
                result = JSON.parse(row.value);
            }
        });
        return result;
    }

    async getUserKey(guildId, userId, key, defaultValue) {
        let result;
        let query = "SELECT `value` FROM `userKeys` WHERE `userId` = ? AND `guildId` = ? AND `key` = ?";
        await get(this.db, query, [userId, guildId, key]).then(async row => {
            if (!row) {
                if (defaultValue !== undefined) {
                    await this.setUserKey(guildId, userId, key, defaultValue);
                }
                result = defaultValue;
            } else {
                result = JSON.parse(row.value);
            }
        });
        return result;
    }

    async setGuildKey(guildId, key, value) {
        let query = "INSERT OR REPLACE INTO guildKeys(`guildId`, `key`, `value`) VALUES(?, ?, ?);";
        await run(this.db, query, [guildId, key, JSON.stringify(value)]);
    }

    async setUserKey(guildId, userId, key, value) {
        let query = "INSERT OR REPLACE INTO userKeys(`userId`, `guildId`, `key`, `value`) VALUES(?, ?, ?, ?);";
        await run(this.db, query, [userId, guildId, key, JSON.stringify(value)]);
    }

    async deleteGuild(guildId, cascadeUsers = false) {
        let query = "DELETE FROM guildKeys WHERE `guildId`=?;";
        await run(this.db, query, [guildId]);
        if(cascadeUsers){
            let query = "DELETE FROM userKeys WHERE `guildId`=?;";
            await run(this.db, query, [guildId]);
        }
    }
}

//Run a query without data output
function run(db, query, params = []) { // async compatible wrapper around the old style callback from sqlite
    return new Promise((resolve, reject) => {
        db.run(query, params, error => {
            if (!error) {
                resolve(this);
            } else {
                reject(error);
            }
        });
    });
}

//Run a query and get the top row
function get(db, query, params = []) { // async compatible wrapper around the old style callback from sqlite
    return new Promise((resolve, reject) => {
        db.get(query, params, (error, row) => {
            if (!error) {
                resolve(row);
            } else {
                reject(error);
            }
        });
    });
}

//Run a query and get all rows
function all(db, query, params = []) { // async compatible wrapper around the old style callback from sqlite
    return new Promise((resolve, reject) => {
        db.all(query, params, (error, rows) => {
            if (!error) {
                resolve(rows);
            } else {
                reject(error);
            }
        });
    });
}
