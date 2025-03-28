const {
  CommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  MessageFlags,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const { isUserPremium } = require("../../Handlers/premium");
const blacklistDB = require("../../Schemas/blacklistSchema");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client, err) {
    const cooldown = new Set();
    if (
      !interaction.isChatInputCommand() &&
      !interaction.isContextMenuCommand()
    )
      return;
    const userData = await blacklistDB.findOne({
      userId: interaction.user.id,
    });
    const command = client.commands.get(interaction.commandName);

    if (!command)
      return interaction.reply({
        content: "This Command is OutDated",
        flags: MessageFlags.Ephemeral,
      });

    // Blacklist
    if (userData) {
      return interaction.reply({
        content: `**You are blacklisted from using this bot.**\nReason: **${userData.reason}**`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const userId = interaction.user.id;

    if (cooldown.has(userId))
      return interaction.reply({
        content:
          "Ayo! you have to wait for 2 seconds before using this command again!",
        flags: MessageFlags.Ephemeral,
      });

    command.execute(interaction, client);
    cooldown.add(interaction.user.id);
    setTimeout(() => {
      cooldown.delete(interaction.user.id);
    }, 2000);

    if (
      command.ownerOnly &&
      interaction.user.id !== `${client.config.developerid}`
    ) {
      return interaction.reply({
        content: "Sorry, this command is only available to the bot owner.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (
      command.ServerOnly &&
      interaction.user.id !== interaction.guild.ownerId
    ) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(
              "This command is only available to the owner of the Discord server."
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const isPremium = await isUserPremium(interaction.user.id);
    //console.log(isPremium);

    if (command.premiumOnly && !isPremium) {
      return interaction.reply({
        content: "Sorry, this command is only available to premium users.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
