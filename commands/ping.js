const dibo = require('../libs/dibo');

module.exports = {
    'names': ['ping', 'p'],
    'privilege': dibo.privilege.USER,
    'summary': 'See exactly how long it takes me to respond to you.',
    'help': '',
    'func' : async (priv, msg) => {
        await msg.reply(`Pong! :bell: \`${(Math.round(msg.client.ws.ping * 100) / 100)}ms\``);
    }
}
