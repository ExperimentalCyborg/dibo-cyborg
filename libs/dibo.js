const Discord = require('discord.js');
const fs = require('fs');
const Database = require('./database');
const Log = require('./log');
const Tools = require('./tools');
const Handler = require('./commandHandler');

const database = new Database();
const client = new Discord.Client({partials: ['MESSAGE', 'REACTION', 'USER']});
const log = new Log(client.shard.ids[0]);

let commands = {};
let commandsList = [];

module.exports = {
    'settings': {},
    'defaultPrefix': '',          // Defined in ./settings.json, applied in loadSettings()
    'getPrefix': getPrefix,       // Helper function implemented down below
    'database': database,         // Instance of ./libs/database.js
    'tools': Tools,               // Instance of ./libs/tools.js
    'log': log,                   // Instance of ./libs/log.js
    'commandHandler': undefined,  // Instance of ./libs/commandHandler.js
    'client': client,             // Discord.js Client object https://discord.js.org/#/docs/main/stable/class/Client
    'commands': commands,         // Dict of all command names and aliases with their corresponding command object
    'commandsList': commandsList, // List of all primary command names
    'privilege': {                // Enumeration of privilege levels for command execution by discord guild members
        'ADMIN': 'Administrator',
        'MOD': 'Moderator',
        'USER': 'User'
    },
    'startTime': Date.now()
};
let settings = module.exports.settings;

// Instantiate classes who need dibo here to avoid a circular reference.
module.exports.commandHandler = new Handler(module.exports);

async function getPrefix(guildId){
    return await database.getGuildKey(guildId, 'prefix', module.exports.defaultPrefix);
}

function loadSettings() {
    module.exports.settings = JSON.parse(fs.readFileSync('./settings.json'));
    module.exports.defaultPrefix = module.exports.settings.prefix;
    log.debugMode = module.exports.settings.debug;
}

function loadCommands() {
    getFilteredFileList('./commands').forEach(fileName => {
        log.info(`... ${fileName}`);
        let cmd;
        try {
            cmd = require(`../commands/${fileName.slice(0, -3)}`);
            commandsList.push(cmd.names[0].toLowerCase());
            cmd.names.forEach(name => {
                commands[name.toLowerCase()] = cmd;
            });
        } catch (reason) {
            log.error('   Failed to load', reason);
            if (module.exports.settings.debug) {
                throw reason;
            }
        }
    });
}

function loadTasks() {
    getFilteredFileList('./tasks').forEach(fileName => {
        log.info(`... ${fileName}`);
        try {
            require(`../tasks/${fileName.slice(0, -3)}`);
        } catch (reason) {
            log.error('   Failed to load', reason);
            if (module.exports.settings.debug) {
                throw reason;
            }
        }
    });
}

function getFilteredFileList(path) {
    let fileNames = fs.readdirSync(path);
    fileNames = fileNames.filter(fileName => fileName.toLowerCase().endsWith('.js'));
    fileNames = fileNames.filter(fileName => !fileName.startsWith('_'));
    return fileNames;
}

function exit() {
    log.info('Shutting down');
    client.destroy();
    database.exit();
    log.info('Goodbye');
    process.exit(0);
}

async function start() {
    log.info('Starting shard');

    log.info('Loading database...');
    await database.start(module.exports.settings.databasefilepath).
        then(() => log.info('Database loaded')).
    catch(reason => {
        log.error('Failed to load or create database', reason);
        process.exit(-10);
    });

    log.info('Loading commands...');
    loadCommands();
    log.info('Commands loaded');

    log.info('Loading tasks...');
    loadTasks();
    log.info('Tasks loaded');

    log.info('Connecting to Discord...');
    await client.login(module.exports.settings.token).
        then(() => log.info('Connected to Discord')).
        catch(reason => log.error('Failed to connect to Discord', reason));
}

process.on('SIGINT', exit);

client.on('ready', () => {
    log.info(`Logged in as ${log.style.underline}${client.user.tag}`)
    client.user.setPresence(module.exports.settings.presence).catch(reason => log.error('Failed to set presence', reason));
});

loadSettings();
start();
