const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("⏩ Skip the current song."),
    
    async execute(interaction, client) {
        try {
            const player = client.manager.players.get(interaction.guild.id);

            if (!player) {
                return interaction.reply({
                    content: ":no_entry_sign: **There is no song playing right now!**",
                    ephemeral: true
                });
            }

            if (!player.queue.current) {
                return interaction.reply({
                    content: ":no_entry_sign: **There is no song playing right now!**",
                    ephemeral: true
                });
            }

            if (player.queue.current.requester.id !== interaction.user.id) {
                return interaction.reply({
                    content: ":no_entry_sign: **You didn't request this song, you can't skip it!**",
                    ephemeral: true
                });
            }

            player.skip();

            const embed = new EmbedBuilder()
                .setColor(client.config.embed)
                .setTitle(":fast_forward: Song Skipped")
                .setDescription(`**[${player.queue.current.title}](${player.queue.current.uri})** \n\n**Skipped by:** \`${interaction.user.username}\``)
                .setFooter({ text: "Next song playing now! :notes:" });

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return interaction.reply(":exclamation: **An error occurred while trying to skip the song.**");
        }
    }
};

