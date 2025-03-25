const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "resume",
    aliases: ["unpause"],
    description: "▶️ Resume the paused song.",

    async execute(message, client, args) {
        try {
            const player = client.manager.players.get(message.guild.id);

            if (!player) {
                return message.reply(":no_entry_sign: **There is no song playing right now!**");
            }

            if (!player.paused) {
                return message.reply(":no_entry_sign: **The song is not paused!**");
            }

            player.pause(false);

            const embed = new EmbedBuilder()
                .setColor(client.config.embed)
                .setTitle(":play_button: Song Resumed")
                .setDescription(`**[${player.queue.current.title}](${player.queue.current.uri})** has been resumed.`)
                .setFooter({ text: "Enjoy the music! 🎶" });

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return message.reply(":exclamation: **An error occurred while trying to resume the song.**");
        }
    }
};

