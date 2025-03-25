const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "pause",
    aliases: ["hold"],
    description: "⏸️ Pause the current song.",

    async execute(message, client, args) {
        try {
            const player = client.manager.players.get(message.guild.id);

            if (!player) {
                return message.reply(":no_entry_sign: **There is no song playing right now!**");
            }

            if (player.paused) {
                return message.reply(":no_entry_sign: **The song is already paused!**");
            }

            player.pause(true);

            const embed = new EmbedBuilder()
                .setColor(client.config.embed)
                .setTitle(":pause_button: Song Paused")
                .setDescription(`**[${player.queue.current.title}](${player.queue.current.uri})** has been paused.`)
                .setFooter({ text: "Use !resume to resume the song! :notes:" }); // Replace ! with your bot's prefix

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return message.reply(":exclamation: **An error occurred while trying to pause the song.**");
        }
    }
};

