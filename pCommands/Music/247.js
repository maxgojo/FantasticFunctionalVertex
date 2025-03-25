const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("../../Schemas/247");

module.exports = {
    name: "247",
    aliases: ["twentyfourseven", '24/7'],
    description: "Toggles 24/7 mode.",
    premiumOnly: false,

    async execute(message, client, args) {
        const { channel } = message.member.voice;

        if (!channel) {
            return message.reply(":no_entry_sign: **You need to be in a voice channel to toggle 24/7 mode!**");
        }

        // Check permissions
        if (!channel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.Connect)) {
            return message.reply(":lock: **I don't have permission to join your voice channel!**");
        }

        if (!channel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.Speak)) {
            return message.reply(":mute: **I don't have permission to play music in your voice channel!**");
        }

        let data = await db.findOne({ _id: message.guild.id });
        const enable = ['enabled', 'activated', 'on'];
        const disable = ['disabled', 'deactivated', 'off'];

        if (!data) {
            // Create a new entry in the database
            data = new db({
                _id: message.guild.id,
                mode: true,
                textChannel: message.channel.id,
                voiceChannel: channel.id,
                moderator: message.author.id,
                lastUpdated: Math.round(Date.now() / 1000),
            });
            await data.save();

            // Create a player if it doesn't exist
            const player = await client.manager.createPlayer({
                guildId: message.guild.id,
                textId: message.channel.id,
                voiceId: channel.id,
                volume: 100,
                deaf: true
            });

            return await message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#00FF00")
                        .setDescription(`24/7 mode is now **${enable[Math.floor(Math.random() * enable.length)]}**.`)
                ]
            });
        } else if (data.mode) {
            // Disable 24/7 mode
            data.mode = false;
            data.moderator = message.author.id;
            data.lastUpdated = Math.round(Date.now() / 1000);
            await data.save();

            return await message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#FF0000")
                        .setDescription(`24/7 mode is now **${disable[Math.floor(Math.random() * disable.length)]}**.`)
                ]
            });
        } else {
            // Enable 24/7 mode
            data.mode = true;
            data.textChannel = message.channel.id;
            data.voiceChannel = channel.id;
            data.moderator = message.author.id;
            data.lastUpdated = Math.round(Date.now() / 1000);
            await data.save();

            // Create a player if it doesn't exist
            const player = await client.manager.createPlayer({
                guildId: message.guild.id,
                textId: message.channel.id,
                voiceId: channel.id,
                volume: 100,
                deaf: true
            });

            return await message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#00FF00")
                        .setDescription(`24/7 mode is now **${enable[Math.floor(Math.random() * enable.length)]}**.`)
                ]
            });
        }
    }
};

