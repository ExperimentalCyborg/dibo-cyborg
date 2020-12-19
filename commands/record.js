const dibo = require('./../libs/dibo');
const Discord = require('discord.js');

module.exports = {
    'names': ['record', 'history'],
    'privilege': dibo.privilege.MOD,
    'summary': "View a user's permanent record.",
    'help': '`%%precord <user>`',
    'func': async (priv, msg, args, userText) => {
        if(!userText){
            return dibo.commandHandler.run(msg, priv, 'help', ['record']);
        }

        let member = await dibo.tools.textToMember(msg.guild, userText);
        if(!member){
            return false;
        }

        let record = await dibo.database.getUserKey(msg.guild.id, member.id, 'record', []);

        let mbed = new Discord.MessageEmbed();
        mbed.setTitle(`Criminal Record of ${member.user.tag}`);
        let body;

        if(!record.length){
            body = '**CLEAN RECORD**';
        }else{
            body = 'Time format is `y/m/d h:m:s`, timezone `UTC`.';
            let counter = 1;
            let entry = record.pop();
            while(entry && counter < 25){
                let time = new Date(entry.timestamp);
                let durationText = '';
                if(entry.duration){
                    durationText = `\n__Duration:__\t${dibo.tools.durationToText(entry.duration * 60 * 1000)}`;
                }
                ('00' + time.getMonth()).substr(-2)

                let timeText = `${('0000' + time.getUTCFullYear()).substr(-4)}/${('00' + time.getUTCMonth()).substr(-2)}/${('00' + time.getUTCDate()).substr(-2)} ${('00' + time.getUTCHours()).substr(-2)}:${('00' + time.getUTCMinutes()).substr(-2)}:${('00' + time.getUTCSeconds()).substr(-2)}`;
                mbed.addField(timeText, `__Action:__\t${entry.type}\n__Reason:__\t${entry.reason}${durationText}`);

                counter += 1;
                entry = record.pop();
            }
            if(counter >= 25){
                body = body + `\n${record.length} older entries are omitted.`;
            }
        }
        mbed.setDescription(body);
        msg.reply(mbed);
    }
}
