const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "volume",
    aliases: ["vol"],
    description: "🔊 Set the volume of the music player.",
    args: true,
    usage: "<volume>",

    async execute(message, client, args) {
        try {
            const player = client.manager.players.get(message.guild.id);

            if (!player) {
                return message.reply(":no_entry_sign: **There is no song playing right now!**");
            }

            if (!player.queue.current) {
                return message.reply(":no_entry_sign: **There is no song playing right now!**");
            }

            const volume = parseInt(args[0]);

            if (isNaN(volume) || volume < 0 || volume > 100) {
                return message.reply(":no_entry_sign: **Volume must be a number between 0 and 100!**");
            }

            player.setVolume(volume);

            const embed = new EmbedBuilder()
                .setColor(client.config.embed)
                .setTitle(":speaker: Volume Set")
                .setDescription(`**Volume set to ${volume}%**`)
                .setFooter({ text: "Enjoy the music! :notes:" });

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return message.reply(":exclamation: **An error occurred while trying to set the volume.**");
        }
    }
};

