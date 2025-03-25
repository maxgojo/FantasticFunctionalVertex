const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildCreate',
  once: false,
  async execute(guild, client) {
    console.log("Joined a new guild: " + guild.name);

    let inviteLink = 'No invite link available';
    try {
      const channels = guild.channels.cache.filter(
        channel => channel.type === 0 &&
        channel.permissionsFor(guild.members.me).has('CreateInstantInvite')
      );
      
      const firstChannel = channels.first();
      if (firstChannel) {
        const invite = await firstChannel.createInvite({ maxAge: 0, maxUses: 0 });
        inviteLink = invite.url;
      }
    } catch (error) {
      console.error("Failed to create invite link:", error);
    }

    const embed = new EmbedBuilder()
      .setTitle(`**Joined A New Server**`)
      .setColor(`Green`)
      .setTimestamp()
      .addFields(
        {
          name: `Guild ID`,
          value: `${guild.id}`,
        },
        {
          name: `Guild Name`,
          value: `${guild.name}`,
        },
        {
          name: `Guild Members`,
          value: `${guild.memberCount}`,
        },
        {
          name: `Vanity`,
          value: `${guild.vanityURLCode || 'None'}`,
        },
        {
          name: `Invite Link`,
          value: inviteLink,
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