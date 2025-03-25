const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "clearqueue",
    aliases: ["clear"],
    description: "♻️ Clear the music queue.",
    
    async execute(message, client, args) {
        try {
            const player = client.manager.players.get(message.guild.id);

            if (!player) {
                return message.reply(":no_entry_sign: **There is no song playing right now!**");
            }

            if (player.queue.size === 0) {
                return message.reply(":no_entry_sign: **The queue is already empty!**");
            }

            player.queue.clear();

            const embed = new EmbedBuilder()
                .setColor(client.config.embed)
                .setTitle(":recycle: Queue Cleared")
                .setDescription("The music queue has been cleared.")
                .setFooter({ text: "Use !play to start playing music again! :notes:" }); // Replace ! with your bot's prefix

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return message.reply(":exclamation: **An error occurred while trying to clear the queue.**");
        }
    }
};

