const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("membercount")
    .setDescription("Get the server member count")
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const fetchedMembers = await interaction.guild.members.fetch({ withPresences: true });

      const onlineMembers = fetchedMembers.filter(
        (member) => member.presence?.status === "online"
      ).size;
      const idleMembers = fetchedMembers.filter(
        (member) => member.presence?.status === "idle"
      ).size;
      const dndMembers = fetchedMembers.filter(
        (member) => member.presence?.status === "dnd"
      ).size;
      const offlineMembers = fetchedMembers.filter(
        (member) => !member.user?.bot && member.presence?.status === "offline"
      ).size;

      const embed = new EmbedBuilder()
        .setColor(client.config.embed)
        .setTitle(`Member Count for ${interaction.guild.name}`)
        .addFields(
          { name: "Total Members", value: `${interaction.guild.memberCount}`, inline: true },
          { name: "Online", value: `${onlineMembers}`, inline: true },
          { name: "Idle", value: `${idleMembers}`, inline: true },
          { name: "Do Not Disturb", value: `${dndMembers}`, inline: true },
          { name: "Offline", value: `${offlineMembers}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: "Member Count Command" });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: "There was an error fetching the member count." });
    }
  },
};

