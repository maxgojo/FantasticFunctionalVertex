const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "skip",
    aliases: ["next"],
    description: "⏩ Skip the current song.",

    async execute(message, client, args) {
        try {
            const player = client.manager.players.get(message.guild.id);

            if (!player) {
                return message.reply(":no_entry_sign: **There is no song playing right now!**");
            }

            if (!player.queue.current) {
                return message.reply(":no_entry_sign: **There is no song playing right now!**");
            }

            if (player.queue.current.requester.id !== message.author.id) {
                return message.reply(":no_entry_sign: **You didn't request this song, you can't skip it!**");
            }

            player.skip();

            const embed = new EmbedBuilder()
                .setColor(client.config.embed)
                .setTitle(":fast_forward: Song Skipped")
                .setDescription(`**[${player.queue.current.title}](${player.queue.current.uri})** \n\n**Skipped by:** \`${message.author.username}\``)
                .setFooter({ text: "Next song playing now! :notes:" });

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return message.reply(":exclamation: **An error occurred while trying to skip the song.**");
        }
    }
};

