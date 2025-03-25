const { EmbedBuilder } = require("discord.js");
const formatDuration = require("../../Handlers/Music/formatDuration");

module.exports = {
  name: "nowplaying",
  aliases: ["np"],
  description: "🗒️ View the currently playing song.",

  async execute(message, client, args) {
    try {
      const player = client.manager.players.get(message.guild.id);

      if (!player) {
        return message.reply(":no_entry_sign: **There is no song playing right now!**");
      }

      if (!player.queue.current) {
        return message.reply(":no_entry_sign: **There is no song playing right now!**");
      }

      const embed = new EmbedBuilder()
        .setColor(client.config.embed)
        .setTitle(":musical_note: Now Playing")
        .setDescription(`**[${player.queue.current.title}](${player.queue.current.uri})**`)
        .addFields(
          { name: "Author:", value: player.queue.current.author, inline: true },
          {
            name: "Source:",
            value: `${player.queue.current.sourceName || "unknown"}`,
            inline: true,
          },
          { name: "Requested By:", value: `${player.queue.current.requester.tag}`, inline: true }
        )
        .setFooter({ text: "Enjoy the music!" });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return message.reply(":exclamation: **An error occurred while trying to view the currently playing song.**");
    }
  },
};

