const dibo = require('../libs/dibo');
const Discord = require('discord.js');

module.exports = {
    'names': ['poll', 'ask'],
    'privilege': dibo.privilege.USER,
    'summary': 'Start a poll.',
    'help': 'The bot will create a message with pre-populated reaction options for you.\n\n' +
        '**Ask a yes/no question**\n' +
        '`%%c [your question here]`\n' +
        'For yes/no questions, quotes are not needed.\n\n' +
        '**Start a multiple choice poll**\n' +
        '`%%c mc! <question> <option 1> <option 2> [option n]`\n' +
        'Any question or option that contains spaces needs to be in quotes! Single word options or questions should not be in quotes. There is a maximum of 10 options.',
    'func': async (priv, msg, args) => {
        if(!args){
            return false;
        }

        let emoji = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '✅', '❌'];
        let mbed = new Discord.MessageEmbed();

        let question;
        let reactions = [];
        if(args.length < 2 || (args[0].toLowerCase() !== "mc!" && args.length > 1)){ // single yes/no poll
            question = args.join(" ");
            question = "Poll: " + question + (question.endsWith('?') ? '' : '?');
            mbed.setDescription(`Asks ${msg.member.nickname || msg.author.username} (${msg.author.tag})`);
            reactions.push(emoji[10]);
            reactions.push(emoji[11]);
        }else{
            question = args[1] + (args[1].endsWith('?') ? '' : '?');
            let desc = "";
            for(let i = 0; i < args.length - 2 && i <= 9; i++){
                desc += `${emoji[i]}: ${args[i+2]}\n`;
                reactions.push(emoji[i]);
            }
            mbed.setDescription(desc);
            mbed.setFooter(`Started by ${msg.member.nickname || msg.author.username} (${msg.author.tag})`);
        }

        mbed.setTitle(question);
        let poll = await msg.reply(mbed);
        for(const emoji of reactions){
            await poll.react(emoji);
        }
    }
}
