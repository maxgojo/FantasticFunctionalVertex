const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "shuffle",
    aliases: ["mix"],
    description: "🔀 Shuffle the music queue.",

    async execute(message, client, args) {
        try {
            const player = client.manager.players.get(message.guild.id);

            if (!player) {
                return message.reply(":no_entry_sign: **There is no song playing right now!**");
            }

            if (player.queue.size === 0) {
                return message.reply(":no_entry_sign: **The queue is empty!**");
            }

            player.queue.shuffle();

            const embed = new EmbedBuilder()
                .setColor(client.config.embed)
                .setTitle(":twisted_rightwards_arrows: Queue Shuffled")
                .setDescription("The music queue has been shuffled.")
                .setFooter({ text: "Enjoy the music! :notes:" });

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return message.reply(":exclamation: **An error occurred while trying to shuffle the queue.**");
        }
    }
};

