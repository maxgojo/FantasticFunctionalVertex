const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildDelete',
  once: false,
  execute(guild, client) {
    console.log("Left a guild: " + guild.name);

    const embed = new EmbedBuilder()
      .setTitle(`Left A Server`)
      .setColor(`Red`)
      .setTimestamp()
      .addFields(
        {
          name: `Guild ID`,
          value: `${guild.id}`,
        },
        {
          name: `Guild Name`,
          value: `${guild.name}`,
        }
      );

    const logChannel = client.channels.cache.get(client.config.logchannel);
    if (logChannel) {
      logChannel.send({ content: `Owner ID: ${guild.ownerId}`, embeds: [embed] });
    } else {
      console.error("Log channel not found.");
    }
  },
};