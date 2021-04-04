const dibo = require('../libs/dibo');

module.exports = {
    'names': ['rewards', 'levels'],
    'privilege': dibo.privilege.USER,
    'summary': 'Shows a list of available reward roles (levels).',
    'help': '',
    'func': async (priv, msg, args) => {
        dibo.cyborg.rewardroles.list(msg);
    }
}