const dibo = require('../libs/dibo');

module.exports = {
    'names': ['echo', 'say', 'repeat'],
    'privilege': dibo.privilege.ADMIN,
    'summary': 'Make me say something.',
    'help': '',
    'func': async (priv, msg, args) => {
        msg.delete().
            catch(reason => dibo.log.warn('Failed to delete echo command message', reason, msg.guild.id));
        msg.channel.send(args.join(' ')).
            catch(reason => dibo.log.warn('Failed to send echo message', reason, msg.guild.id));
    }
}
