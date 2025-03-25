const {
  EmbedBuilder,
  SlashCommandBuilder,
  MessageFlags,
  PermissionsBitField,
} = require("discord.js");
const InviteSchema = require("../../Schemas/inviteSchema");

async function getInviteCount(userId, guildId) {
  const inviteData = await InviteSchema.find({ Guild: guildId });
  const userInvite = inviteData.find(invite => invite.LastUser  === userId);
  return userInvite ? userInvite.Count : 0;
}

async function getLeaderboard(guildId) {
  const inviteData = await InviteSchema.find({ Guild: guildId }).sort({ Count: -1 }).limit(10);
  return inviteData.map(data => ({
      userId: data.LastUser ,
      count: data.Count
  }));
}

module.exports = {
  data: new SlashCommandBuilder()
      .setName("invite-tracker")
      .setDescription("Manage the invite tracking system.")
      .addSubcommand(subcommand =>
          subcommand
              .setName("setup")
              .setDescription("Setup the invite tracking channel.")
              .addChannelOption(option =>
                  option.setName("channel")
                      .setDescription("The channel to send invite messages.")
                      .setRequired(true))
              .addStringOption(option =>
                  option.setName("message")
                      .setDescription("Custom message for the invite notification.")
                      .setRequired(true)))
      .addSubcommand(subcommand =>
          subcommand
              .setName("disable")
              .setDescription("Disable the invite tracking system."))
      .addSubcommand(subcommand =>
          subcommand
              .setName("count")
              .setDescription("Show the invite count of a user.")
              .addUserOption(option =>
                  option.setName("user")
                      .setDescription("The user to check invites for.")))
      .addSubcommand(subcommand =>
          subcommand
              .setName("leaderboard")
              .setDescription("Show the top 10 inviters."))
      .addSubcommand(subcommand =>
          subcommand
              .setName("reset")
              .setDescription("Reset the invite count of a user.")
              .addUserOption(option =>
                  option.setName("user")
                      .setDescription("The user to reset invites for.")
                      .setRequired(true))),
  
  async execute(interaction, client) {
    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      return await interaction.reply({
        content: "You **do not** have the permission to do that!",
        flags: MessageFlags.Ephemeral,
      });
    }
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === "setup") {
          const existingData = await InviteSchema.findOne({ Guild: interaction.guild.id });
          if (existingData) {
              return interaction.reply(`Invite tracking is already set up in <#${existingData.Channel}>.`);
          }
          const channel = interaction.options.getChannel("channel");
          const message = interaction.options.getString("message");
          await InviteSchema.findOneAndUpdate(
              { Guild: interaction.guild.id },
              { Channel: channel.id, Message: message },
              { upsert: true }
          );
          await interaction.reply(`Invite tracking has been set up in ${channel} with the message: "${message}"`);
      } else if (subcommand === "disable") {
          await InviteSchema.findOneAndDelete({ Guild: interaction.guild.id });
          await interaction.reply("Invite tracking has been disabled.");
      } else if (subcommand === "count") {
          const user = interaction.options.getUser ("user") || interaction.user;
          const inviteCount = await getInviteCount(user.id, interaction.guild.id);
          const embed = new EmbedBuilder()
              .setColor("#7289da")
              .setTitle(`${user.username}'s Invite Count`)
              .setDescription(`${user} has ${inviteCount} invites.`);
          await interaction.reply({ embeds: [embed] });
      } else if (subcommand === "leaderboard") {
          const leaderboard = await getLeaderboard(interaction.guild.id);
          const embed = new EmbedBuilder()
              .setColor("#7289da")
              .setTitle("Invite Leaderboard")
              .setDescription(leaderboard.map((entry, index) => `${index + 1}. <@${entry.userId}> - ${entry.count} invites`).join("\n"));
          await interaction.reply({ embeds: [embed] });
      } else if (subcommand === "reset") {
          const user = interaction.options.getUser ("user");
          await InviteSchema.findOneAndUpdate(
              { Guild: interaction.guild.id, LastUser: user.id },
              { Count: 0 },
              { upsert : true }
          );
          await interaction.reply(`${user} has had their invite count reset.`);
      }
  },
};