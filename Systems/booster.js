const {
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags,
    PermissionsBitField,
    ButtonStyle,
} = require('discord.js');
const BoosterChannel = require('../Schemas/boosterChannel');

module.exports = (client) => {
    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
        if (!oldMember.premiumSince && newMember.premiumSince) {
          const boosterChannelData = await BoosterChannel.findOne();
          const idchannel = boosterChannelData ? boosterChannelData.channelId : null;
      
          if (idchannel) {
            const channel = client.channels.cache.get(idchannel);
            if (channel) {
              let avatarURL = newMember.user.displayAvatarURL({ format: 'webp', dynamic: true, size: 1024 });
              avatarURL = avatarURL.replace('.webp', '.png');
              let embed = new EmbedBuilder()
                .setColor('FFC0CB')
                .setTitle("Thank You for Boosting!")
                .setDescription(`Thank you ${newMember.user.toString()}, for boosting our server! Your support means a lot to us.`)
                .setThumbnail(newMember.user.displayAvatarURL({ format: "png", dynamic: true }))
                .setImage(`https://api.aggelos-007.xyz/boostcard?avatar=${avatarURL}&username=${newMember.user.username}`)
                .setTimestamp();
      
              await channel.send({ embeds: [embed] });
            } else {
              console.error(`Channel with ID ${idchannel} not found.`);
            }
          } else {
            console.error('No booster channel set in the database.');
          }
        }
      });
};

