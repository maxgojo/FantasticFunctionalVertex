const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "stop",
    aliases: ["end"],
    description: "⏹️ Stop the music and clear the queue.",

    async execute(message, client, args) {
        try {
            const player = client.manager.players.get(message.guild.id);

            if (!player) {
                return message.reply(":no_entry_sign: **There is no song playing right now!**");
            }

            player.queue.clear(); // Clear the queue
            player.destroy(); // Stop the music and destroy the player

            const embed = new EmbedBuilder()
                .setColor(client.config.embed)
                .setTitle(":stop_button: Music Stopped")
                .setDescription("The music has been stopped and the queue has been cleared.")
                .setFooter({ text: "Use !play to start playing music again! :notes:" }); // Replace ! with your bot's prefix

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return message.reply(":exclamation: **An error occurred while trying to stop the music.**");
        }
    }
};

