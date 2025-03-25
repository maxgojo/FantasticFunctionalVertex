const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, MessageFlags } = require("discord.js");
const aiConfig = require("../../Schemas/aiSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ai-config")
    .setDescription("Configure Artificial Intelligence in your server!"),

  execute: async function (interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return await interaction.reply({
        content: `<:error:1238390205707325500> | You don't have perms to manage the AI configuration system.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const data = await aiConfig.findOne({ guildId: interaction.guild.id });
    const embed = new EmbedBuilder()
      .setTitle(`AI Configuration Panel`)
      .setDescription(`\`\`\`md\n# Welcome to the ChatBot System\n> Based on Google Gemini v1.5 ;)\`\`\``)
      .addFields({
        name: `System Status`,
        value: `\`\`\`ansi
\u001b[32m□ SYSTEM ONLINE\n\u001b[32m├───> All Systems Operational\n\u001b[32m├───> Features: Fully Available\n\u001b[32m└───> Updates: Real-time Enabled\`\`\``,
        inline: false
      })
      .setColor(client.config.embed)
      .setTimestamp();

    // Main Panel Buttons
    const mainButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("channel_setup")
        .setLabel("Channel")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!!data), // Disable the button if AI is already configured
      new ButtonBuilder()
        .setCustomId("blacklist_setup")
        .setLabel("Blacklist")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("disable_ai")
        .setLabel("Disable AI")
        .setStyle(ButtonStyle.Secondary)
    );

    // Blacklist Buttons
    const blacklistButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("blacklist_add")
        .setLabel("Add")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("blacklist_remove")
        .setLabel("Remove")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("back_to_main")
        .setLabel("Back")
        .setStyle(ButtonStyle.Secondary)
    );
    let blacklistedUsers = "";
    let blacklistedCount = 0;
    if (data) {
      const channel = interaction.guild.channels.cache.get(data.channelId);
      blacklistedCount = data.blacklists ? data.blacklists.length : 0; // Check if blacklists exists
      blacklistedUsers = data.blacklists && data.blacklists.length > 0 ? data.blacklists.map(userId => `- <@${userId}>\n`).join("") : "No users blacklisted.";
      embed.addFields({
        name: `Active Configuration`,
        value: `\`\`\`yml\n"channel" : "${data.channelId}"\n"blacklisted-users" : "${blacklistedCount}"\`\`\``,
        inline: true
      });
    } else {
      embed.addFields({
        name: `Active Configuration`,
        value: `\`\`\`yml\n"channel" : "Not Setuped"\n"blacklisted-users" : "${blacklistedCount}"\`\`\``,
        inline: true
      });
    }

    // Send the initial message with buttons
    const reply = await interaction.reply({
      embeds: [embed],
      components: [mainButtons],
      fetchReply: true,
    });

    // Button Interaction Collector
    const collector = reply.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: "You cannot interact with this panel.",
          ephemeral: true,
        });
      }

      switch (i.customId) {
        case "channel_setup":
          if (i.replied) return; // Prevent multiple replies
          await i.reply({
            content: "Please mention the channel where you want to bind the AI.",
            ephemeral: true
          });

          const channelFilter = (m) => m.author.id === interaction.user.id;
          const channelCollector = interaction.channel.createMessageCollector({
            filter: channelFilter,
            time: 30000,
            max: 1,
          });

          channelCollector.on("collect", async (m) => {
            const channel = m.mentions.channels.first();
            if (!channel) {
              await m.reply({
                content: "Invalid channel mentioned. Please try again.",
                ephemeral: true,
              });
              return; // Exit early if the channel is invalid
            }

            // Create or update the AI configuration
            if (!data) {
              await aiConfig.create({
                guildId: interaction.guild.id,
                channelId: channel.id,
                blacklists: [], // Initialize blacklists if not present
              });
            } else {
              await aiConfig.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { channelId: channel.id }
              );
            }

            await m.reply({
              content: `AI has been bound to ${channel}.`,
              ephemeral: true,
            });

            // Update the embed with the new channel information
            embed.fields = embed.fields.filter(field => field.name !== "Active Configuration"); // Remove old Active Configuration field
            embed.addFields({
              name: `Active Configuration`,
              value: `\`\`\`yml\n"channel" : "${channel.id}"\n"blacklisted-users" : "${blacklistedCount}"\`\`\``,
              inline: true
            });

            // Edit the original reply to update the embed
            await i.editReply({
              embeds: [embed],
              components: [mainButtons],
            });
          });

          channelCollector.on("end", (collected) => {
            if (collected.size === 0) {
              i.followUp({
                content: "You did not respond in time. Please try again.",
                ephemeral: true,
              });
            }
          });
          break;

        case "blacklist_setup":
          if (i.replied) return; // Prevent multiple replies
          await i.update({
            content: "Choose an action to manage the blacklist.",
            components: [blacklistButtons],
          });
          break;

        case "blacklist_add":
          await i.reply({
            content: "Please mention the user you want to blacklist.",
            components: [],
            ephemeral: true
          });

          const addFilter = (m) => m.author.id === interaction.user.id;
          const addCollector = interaction.channel.createMessageCollector({
            filter: addFilter,
            time: 30000,
            max: 1,
          });

          addCollector.on("collect", async (m) => {
            const user = m.mentions.users.first();
            if (!user) {
              return m.reply({
                content: "Invalid user mentioned. Please try again.",
                ephemeral: true,
              });
            }

            if (!data) {
              return m.reply({
                content: "You need to configure AI before managing the blacklist.",
                ephemeral: true,
              });
            }

            if (data.blacklists.includes(user.id)) {
              return m.reply({
                content: "This user is already blacklisted.",
                ephemeral: true,
              });
            }

            data.blacklists.push(user.id);
            await data.save();

            await m.reply({
              content: `${user} has been blacklisted from using AI.`,
              ephemeral: true,
            });

            await i.update({
              content: `Use the buttons below to configure further.`,
              components: [mainButtons],
            });
          });
          break;

        case "blacklist_remove":
          await i.update({
            content: `Please mention the user you want to remove from the blacklist.`,
            components: [],
            ephemeral: true,
          });

          const removeFilter = (m) => m.author.id === interaction.user.id;
          const removeCollector = interaction.channel.createMessageCollector({
            filter: removeFilter,
            time: 30000,
            max: 1,
          });

          removeCollector.on("collect", async (m) => {
            const user = m.mentions.users.first();
            if (!user) {
              return m.reply({
                content: "Invalid user mentioned. Please try again.",
                ephemeral: true,
              });
            }

            if (!data) {
              return m.reply({
                content: "You need to configure AI before managing the blacklist.",
                ephemeral: true,
              });
            }

            if (!data.blacklists.includes(user.id)) {
              return m.reply({
                content: "This user is not blacklisted.",
                ephemeral: true,
              });
            }

            data.blacklists = data.blacklists.filter((id) => id !== user.id);
            await data.save();

            await m.reply({
              content: `${user} has been removed from the blacklist.`,
              ephemeral: true,
            });

            await i.editReply({
              content: `Use the buttons below to configure further.`,
              components: [mainButtons],
            });
          });
          break;

        case "back_to_main":
          await i.update({
            content: ``,
            embeds: [embed],
            components: [mainButtons],
          });
          break;

        case "disable_ai":
          if (!data) {
            return i.reply({
              content: "AI is not configured in this server.",
              ephemeral: true,
            });
          }

          await aiConfig.findOneAndDelete({ guildId: interaction.guild.id });
          await i.update({
            embeds: [embed.addFields({
              name: `Updated Configuration`,
              value: `\`\`\`yml\n"channel" : "Not Setuped"\n"blacklisted-users" : "${blacklistedCount}"\`\`\``,
              inline: true
            })],
            components: [],
            ephemeral: true
          });
          await i.reply({
            content: "AI has been disabled in this server.",
          })
          break;
      }
    });

    collector.on("end", () => {
      interaction.editReply({
        content: "The AI configuration panel has timed out.",
        components: [],
      });
    });
  },
};

