let dibo; // To avoid circular references at load time, this reference to ./libs/dibo.js is defined in dibo.js.

module.exports = class {
    constructor(_dibo) {
        if (_dibo) {
            dibo = _dibo;
        }
    }

    static async run(message, privilege, command, parameters) {
        let canRun = this.can_run(privilege, command);
        if (canRun === undefined) {
            dibo.log.debug(`Invalid command: \`${message.author.tag}\` tried to run \`${command}(${parameters.join(', ')})\``,
                undefined, message.guild.id);
            return false;
        } else if (canRun === false) {
            dibo.log.debug(`Unauthorized command: \`${message.author.tag}\` tried to run \`${command}(${parameters.join(', ')})\``,
                dibo.tools.makeMsgLink(message), message.guild.id);
            return false;
        }

        dibo.commands[command].func(privilege, message, parameters, ...parameters).then(value => {
            if (value === true) {
                this.feedback_good(message);
            } else if (value === false) {
                this.feedback_bad(message);
            } else {
                this.feedback_neutral(message);
            }
        }).catch(reason => {
            this.feedback_bad(message);
            dibo.log.error(`Command error: ${dibo.tools.makeMsgLink(message)}`, reason, message.guild.id);
            if (dibo.debugMode) {
                throw reason;
            }
        });
        return true;
    }

    static can_run(priv, command) {
        if (!dibo.commands.hasOwnProperty(command)) {
            return; // doesn't exist
        }

        if (priv === dibo.privilege.ADMIN) {
            return true; // admin can do anything
        }

        if (priv === dibo.commands[command].privilege) {
            return true; // explicitly mentioned in the privilege list
        }

        if (priv === dibo.privilege.MOD && dibo.commands[command].privilege === dibo.privilege.USER) {
            return true; // mods can do anything that users can do
        }

        return false; // anything else is not allowed
    }

    static feedback_neutral(message) {
        //(you can put something fun here, idk)
    }

    static feedback_good(message) {
        message.react('✅').catch(reason => dibo.log.debug(`Failed to react to command message ${dibo.tools.makeMsgLink(message)}`, reason, message.guild.id));
    }

    static feedback_bad(message) {
        message.react('❌').catch(reason => dibo.log.debug(`Failed to react to command message ${dibo.tools.makeMsgLink(message)}`, reason, message.guild.id));
    }
}
