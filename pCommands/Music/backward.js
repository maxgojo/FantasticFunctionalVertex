const { EmbedBuilder } = require("discord.js");
const formatDuration = require("../../Handlers/Music/formatDuration");

module.exports = {
  name: "backward",
  aliases: ["rewind"],
  description: "⏪ Backward the current song by a specified amount of time.",
  args: true,
  usage: "<seconds>",
  
  async execute(message, client, args) {
    try {
      const player = client.manager.players.get(message.guild.id);

      if (!player) {
        return message.reply(":no_entry_sign: **There is no song playing right now!**");
      }

      if (!player.queue.current) {
        return message.reply(":no_entry_sign: **There is no song playing right now!**");
      }

      const seconds = parseInt(args[0]);

      if (isNaN(seconds) || seconds < 0) {
        return message.reply(":no_entry_sign: **You must provide a valid positive number of seconds to backward the song!**");
      }

      const position = player.position - (seconds * 1000);

      if (position < 0) {
        return message.reply(":no_entry_sign: **You can't backward the song by that much!**");
      }

      player.seek(position);

      const embed = new EmbedBuilder()
        .setColor(client.config.embed)
        .setTitle(":rewind: Song Backwarded")
        .setDescription(`**[${player.queue.current.title}](${player.queue.current.uri})** \n\n**Backwarded by:** \`${message.author.username}\``)
        .setFooter({ text: `Backwarded to ${formatDuration(position, true)} :notes:` });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return message.reply(":exclamation: **An error occurred while trying to backward the song.**");
    }
  }
};

