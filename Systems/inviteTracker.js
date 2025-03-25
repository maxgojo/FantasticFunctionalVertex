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
const InviteSchema = require("../Schemas/inviteSchema");

module.exports = (client) => {
    client.on('ready', async () => {
        const guilds = client.guilds.cache;
      
        for (const guild of guilds.values()) {
          const invites = await guild.invites.fetch();
          for (const invite of invites.values()) {
            await InviteSchema.findOneAndUpdate(
              { Guild: guild.id, LastUser: invite.inviter.id },
              { Count: invite.uses },
              { upsert: true }
            );
          }
        }
      });
      
      client.on('guildMemberAdd', async (member) => {
        const InviteData = await InviteSchema.find({ Guild: member.guild.id });
        if (!InviteData) return;
      
        const invites = await member.guild.invites.fetch();
      
      
        const usedInvite = invites.find(invite => {
          const previousInviteData = InviteData.find(data => data.LastUser  === invite.inviter.id);
          return previousInviteData && invite.uses > previousInviteData.Count;
        });
      
        if (usedInvite) {
          const inviter = await member.guild.members.fetch(usedInvite.inviter.id);
          const message = `Hey! <@${member.id}> | Invited By: <@${inviter.id}> | Invite Count: ${usedInvite.uses}`;
          const channel = member.guild.channels.cache.get(InviteData[0].Channel);
          
          if (channel) {
            channel.send(message);
          }
      
          await InviteSchema.findOneAndUpdate(
            { Guild: member.guild.id, LastUser: inviter.id },
            { $inc: { Count: 1 } },
            { upsert: true }
          );
      
          //console.log(`Invite count updated for ${inviter.id}. New count: ${usedInvite.uses}`);
        } else {
          //console.log('No used invite found');
        }
      });
};

