const dibo = require('../libs/dibo');
const Discord = require('discord.js');
const crypto = require('crypto');

module.exports = {
    'names': ['roll', 'dice'],
    'privilege': dibo.privilege.USER,
    'summary': 'Roll dice.',
    'help':'It\'s all fun and games.\n\n' +
        '**Roll one standard 6-sided die**\n' +
        '`%%c`\n\n' +
        '**Roll a specific number of n-sided dice**\n' +
        '`%%c [amount of dice]d<amount of sides per die>`\n' +
        'For example, `2d8` will roll two 8-sided dice.\n\n' +
        '**Specific dice with a fixed modifier**\n' +
        '`%%c [amount of dice]d<amount of sides per die>[+modifier]`\n' +
        'For example, `2d8+4` will roll two 8-sided dice, and always adds 4 to the end result.\n\n' +
        'Any text after the roll command will be included in the result so you can specify what the roll was for. For example: `3d6+2 dexterity`',
    'func': async (priv, msg, args, command) => {
        let dice = 1;
        let sides = 6;
        let modifier = 0;

        if(command){
            let matches = command.toLowerCase().match(/(\d*)d(\d*)(\+\d+)?/);
            if(matches) {
                if (matches[1])
                    dice = Number(matches[1]);
                if (matches[2])
                    sides = Number(matches[2]);
                if (matches[3])
                    modifier = Number(matches[3]);
            }
        }

        if(sides < 2 || dice > 10000){
            return false;
        }

        let results = [];
        let sum = 0;
        for(let i = 0; i < dice; i++){
            let n = crypto.randomInt(1, sides);
            results.push(n);
            sum += n;
        }

        let result_text;
        if(results.length < 2 && !modifier){
            result_text = `${sum}`;
        }else{
            result_text = results.join('+');
            if(result_text.length > 1800){
                result_text = `${sum}`;
            }
            if(modifier){
                result_text += `(+${modifier})`;
                sum += modifier;
            }
            result_text += ` = **${sum}**`;
        }

        let description = '';
        if(args[1]){
            description = ' ' + args.slice(1).join(' ');
        }

        let mbed = new Discord.MessageEmbed();
            mbed.setTitle(`🎲${dice}d${sides}${modifier?'+':''}${modifier?modifier:''}${description}`);
            mbed.setDescription(result_text);
            mbed.setFooter(`Rolled by ${msg.member.nickname || msg.author.username} (${msg.author.tag})`);

        await msg.reply(mbed);
        msg.delete();
    }
}
