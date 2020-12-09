const dibo = require('../libs/dibo');

module.exports = {
    'names': ['privilege', 'priv'],
    'privilege': dibo.privilege.USER,
    'summary': 'Check your (bot) privilege.',
    'help': '',
    'func': async (priv, msg) => {
        await msg.reply(`You are \`${priv}\`.`);
    }
}
