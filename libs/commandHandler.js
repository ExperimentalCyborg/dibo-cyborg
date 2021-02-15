module.exports = class {
    constructor(dibo) {
        this.dibo = dibo; // To avoid circular references at load time
        this.defaultChannelRestrictions = {
            'type': 'deny',
            'channels': []
        }
    }

    async run(message, privilege, command, parameters) {
        let canRun = this.canRun(privilege, command);
        if (canRun === undefined) {
            this.dibo.log.debug(`Invalid command: ${message.author} tried to run \`${command}(${parameters.join(', ')})\``,
                undefined, message.guild.id);
            return false;
        } else if (canRun === false) {
            this.dibo.log.debug(`Unauthorized command: ${message.author.tag} tried to run \`${command}(${parameters.join(', ')})\``,
                this.dibo.tools.makeMsgLink(message), message.guild.id);
            return false;
        }

        if(!this.dibo.commands[command]['bypassRestrictions'] &&
            !await this.checkChannelRestrictions(message.guild.id, message.channel.id, privilege)){
            this.dibo.log.debug(`Restricted channel: ${message.author} tried to run \`${command}(${parameters.join(', ')})\` in ${message.channel}`,
                undefined, message.guild.id);
            return false;
        }

        this.dibo.commands[command].func(privilege, message, parameters, ...parameters).then(value => {
            if (value === true) {
                this.feedbackGood(message);
            } else if (value === false) {
                this.feedbackBad(message);
            } else {
                this.feedbackNeutral(message);
            }
        }).catch(reason => {
            this.feedbackBad(message);
            this.dibo.log.error(`Command error: ${this.dibo.tools.makeMsgLink(message)}`, reason, message.guild.id);
            if (this.dibo.settings.debug) {
                throw reason;
            }
        });
        return true;
    }

    canRun(priv, command) {
        if (!this.dibo.commands.hasOwnProperty(command)) {
            return; // doesn't exist
        }

        if (priv === this.dibo.privilege.ADMIN) {
            return true; // admin can do anything
        }

        if (priv === this.dibo.commands[command].privilege) {
            return true; // explicitly mentioned in the privilege list
        }

        if (priv === this.dibo.privilege.MOD && this.dibo.commands[command].privilege === this.dibo.privilege.USER) {
            return true; // mods can do anything that users can do
        }

        return false; // anything else is not allowed
    }

    feedbackNeutral(message) {
        //(you can put something fun here, idk)
    }

    feedbackGood(message) {
        message.react('✅').catch(reason => this.dibo.log.debug(`Failed to react to command message ${this.dibo.tools.makeMsgLink(message)}`, reason, message.guild.id));
    }

    feedbackBad(message) {
        message.react('❌').catch(reason => this.dibo.log.debug(`Failed to react to command message ${this.dibo.tools.makeMsgLink(message)}`, reason, message.guild.id));
    }

    async checkChannelRestrictions(guildId, channelId, privilege){
        if(privilege !== this.dibo.privilege.USER){
            return true;
        }

        let restrictions = await this.dibo.database.getGuildKey(guildId, 'channelRestrictions', this.defaultChannelRestrictions);

        if(restrictions['type'] === 'deny'){
            return restrictions['channels'].indexOf(channelId) === -1; // not in deny list is good
        }else if(restrictions['type'] === 'allow'){
            return restrictions['channels'].indexOf(channelId) !== -1; // not not in allow list is good
        }

        this.dibo.log.error('checkChannelRestrictions encountered unexpected channel restriction type in guild',
            restrictions['type'], guildId);
        return true; // fallback
    }
}
