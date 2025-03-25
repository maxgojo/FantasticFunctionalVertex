const {
  EmbedBuilder,
  SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");
const TwitchNotification = require('../../Schemas/twitchSchema');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("twitch")
    .setDescription("Setup or manage Twitch notifications for a streamer.")
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('Setup Twitch notifications for a streamer.')
        .addChannelOption(option => 
          option.setName('channel')
            .setDescription('The channel to send notifications to')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('streamer')
            .setDescription('The Twitch streamer URL')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('message')
            .setDescription('Custom message to send when the streamer is live')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('disable')
        .setDescription('Disable Twitch notifications for a streamer.')
        .addStringOption(option => 
          option.setName('streamer')
            .setDescription('The Twitch streamer URL to disable notifications for')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all streamers set up for notifications.')),

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

    if (subcommand === 'setup') {
      const channel = interaction.options.getChannel('channel');
      const streamer = interaction.options.getString('streamer');
      const message = interaction.options.getString('message');

      const newNotification = new TwitchNotification({
        Guild: interaction.guild.id,
        Channel: channel.id,
        Streamer: streamer,
        Message: message,
      });
      
      await newNotification.save();

      await interaction.reply(`Notification channel set to ${channel} for streamer ${streamer} with message: "${message}".`);
    } else if (subcommand === 'disable') {
      const streamer = interaction.options.getString('streamer');

      const result = await TwitchNotification.deleteOne({
        Guild: interaction.guild.id,
        Streamer: streamer,
      });

      if (result.deletedCount > 0) {
        await interaction.reply(`Notifications for streamer ${streamer} have been disabled.`);
      } else {
        await interaction.reply(`No notifications found for streamer ${streamer}.`);
      }
    } else if (subcommand === 'list') {
      const notifications = await TwitchNotification.find({ Guild: interaction.guild.id });

      if (notifications.length === 0) {
        await interaction.reply('No Twitch notifications set up for this server.');
      } else {
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('Twitch Notifications')
          .setDescription('List of streamers set up for notifications:')
          .setTimestamp();

        notifications.forEach((notification, index) => {
          embed.addFields({ name: `${index + 1}.`, value: `[${notification.Streamer}](${notification.Streamer})`, inline: false });
        });

        await interaction.reply({ embeds: [embed] });
      }
    }
  },
};