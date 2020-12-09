module.exports = class {
    // log levels
    LVL_ERROR = 'error';
    LVL_INFO = 'info';
    LVL_DEBUG = 'debug';

    constructor(shardId, logCallback = (level, guildId, message, data) => {}, debugMode = false) {
        if (shardId === undefined) {
            this.shardId = 'MAIN';
        } else {
            this.shardId = ('0000' + shardId).substr(-4);
        }
        this.debugMode = debugMode;
        this.logCallback = logCallback;
    }

    error(problem, reason, guildId, consoleOnly) {
        this.log(this.LVL_ERROR, problem, reason, guildId, consoleOnly);
    }

    info(message, data, guildId, consoleOnly) {
        this.log(this.LVL_INFO, message, data, guildId, consoleOnly);
    }

    debug(message, data, guildId, consoleOnly) {
        if (this.debugMode) {
            this.log(this.LVL_DEBUG, message, data, guildId, consoleOnly);
        }
    }

    log(level, message, data, guildId, consoleOnly){
        if(guildId === undefined || this.debugMode || consoleOnly){
            let levelTxt;
            switch (level){
                case this.LVL_INFO:
                    levelTxt = 'INFO';
                    break
                case this.LVL_ERROR:
                    levelTxt = `${this.style.red}ERROR${this.style.reset}`;
                    break
                case this.LVL_DEBUG:
                    levelTxt = `${this.style.yellow}DEBUG${this.style.reset}`;
                    break
            }

            let dataTxt;
            if (data === undefined) {
                dataTxt = '';
            } else {
                dataTxt = ` | ${data}`;
            }

            let guildIdTxt;
            if (guildId === undefined) {
                guildIdTxt = '';
            } else {
                guildIdTxt = `| ${guildId} `;
            }

            let logText = `${this.shardId} ${new Date().toISOString()} | ${levelTxt} ${guildIdTxt}| ${message}${dataTxt}${this.style.reset}`;

            if(level === this.LVL_ERROR){
                console.error(logText);
            }else{
                console.log(logText);
            }
        }

        if(!consoleOnly && guildId !== undefined){
            this.logCallback(level, guildId, this.stripColor(message), data);
        }
    }

    stripColor(text){
        Object.keys(this.style).forEach(color =>{
            text = text.replace(this.style[color], '');
        })
        return text;
    }

    style = { // Thanks to https://github.com/BR88C
        'black': '\x1b[30m',
        'red_dark': '\x1b[31m',
        'green_dark': '\x1b[32m',
        'yellow_dark': '\x1b[33m',
        'blue_dark': '\x1b[34m',
        'magenta_dark': '\x1b[35m',
        'cyan_dark': '\x1b[36m',
        'grey_light': '\x1b[37m',
        'grey': '\x1b[90m',
        'red': '\x1b[91m',
        'green' : '\x1b[92m',
        'yellow': '\x1b[93m',
        'blue': '\x1b[94m',
        'magenta': '\x1b[95m',
        'cyan': '\x1b[96m',
        'white': '\x1b[97m',
        'bold': '\x1b[1m',
        'italic': '\x1b[3m',
        'underline': '\x1b[4m',
        'reset': '\x1b[0m'
    };
}
