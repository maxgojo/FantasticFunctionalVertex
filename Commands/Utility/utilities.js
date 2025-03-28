const {
  EmbedBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  ModalBuilder,
  Client,
  GuildTextThreadManager,
  ChatInputCommandInteraction,
  MessageFlags,
  time,
  TextInputStyle,
  PermissionFlagsBits,
  PermissionsBitField,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require(`discord.js`);

const { Types } = require("mongoose");
const schedule = require("node-schedule");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(`utilities`)
    .setDescription(`Idk put whatever xD`)
    .addSubcommand((command) =>
      command
        .setName(`enlarge`)
        .setDescription(`Enlarge an emoji`)
        .addStringOption((option) =>
          option
            .setName("emoji")
            .setDescription("The emoji to enlarge")
            .setRequired(true)
        )
    )
    .addSubcommand((command) =>
      command.setName(`emoji-list`).setDescription(`Displays guilds emojis.`)
    )
    .addSubcommand((command) =>
      command
        .setName(`avatar`)
        .setDescription(`Get anybody's Profile Picture / Banner.`)
        .addUserOption((option) =>
          option
            .setName(`user`)
            .setDescription(`Select a user`)
            .setRequired(false)
        )
    ),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    
    // Enlarge
    switch (sub) {
      case "enlarge":
        const emoji = interaction.options.getString("emoji");

        const emojiRegex = /^<a?:.+:(\d+)>$/;
        const match = emoji.match(emojiRegex);

        if (!match) {
          return await interaction.reply({
            content: "Please provide a valid emoji!",
            flags: MessageFlags.Ephemeral,
          });
        }

        const emojiId = match[1];

        const enlargedEmojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${
          emoji.startsWith("<a:") ? "gif" : "png"
        }?size=1024`;

        await interaction.reply({ content: enlargedEmojiUrl });
    }

    // Emoji-list
    switch (sub) {
      case "emoji-list":
        const emojis = interaction.guild.emojis.cache.map(
          (e) => `${e} | \`${e}\``
        );
        const pageSize = 10;
        const pages = Math.ceil(emojis.length / pageSize);
        let currentPage = 0;

        const generateEmbed = (page) => {
          const start = page * pageSize;
          const end = start + pageSize;
          const emojiList =
            emojis.slice(start, end).join("\n") || "This server has no emojis.";

          const embed = new EmbedBuilder()
            .setTitle(`Emojis (Page ${page + 1} of ${pages})`)
            .setDescription(`${emojiList}`);
          return embed;
        };

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("previous")
            .setLabel("Previous")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("Next")
            .setStyle(ButtonStyle.Primary)
        );

        const message = await interaction.reply({
          embeds: [generateEmbed(currentPage)],
          components: [row],
          fetchReply: true,
        });

        const collector = await message.createMessageComponentCollector();

        collector.on("collect", async (interaction) => {
          if (interaction.customId === "previous") {
            currentPage--;
            if (currentPage < 0) {
              currentPage = pages - 1;
            }
          } else if (interaction.customId === "next") {
            currentPage++;
            if (currentPage > pages - 1) {
              currentPage = 0;
            }
          }
          await interaction.update({
            embeds: [generateEmbed(currentPage)],
            components: [row],
          });
        });

        collector.on("end", async () => {
          row.components.forEach((c) => {
            c.setDisabled(true);
          });
          await message.edit({ components: [row] });
        });
    }
    
    // Avatar
    switch (sub) {
      case "avatar":
        const usermention =
          interaction.options.getUser(`user`) || interaction.user;
        let banner = await (
          await client.users.fetch(usermention.id, { force: true })
        ).bannerURL({ dynamic: true, size: 4096 });

        const cmp = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel(`Avatar`)
            .setCustomId(`avatar`)
            .setDisabled(true)
            .setStyle(ButtonStyle.Primary),

          new ButtonBuilder()
            .setLabel(`Banner`)
            .setCustomId(`banner`)
            .setStyle(ButtonStyle.Secondary),

          new ButtonBuilder()
            .setLabel(`Delete`)
            .setCustomId(`delete`)
            .setStyle(ButtonStyle.Danger)
        );

        const cmp2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel(`Avatar`)
            .setCustomId(`avatar`)
            .setStyle(ButtonStyle.Primary),

          new ButtonBuilder()
            .setLabel(`Banner`)
            .setCustomId(`banner`)
            .setDisabled(true)
            .setStyle(ButtonStyle.Secondary),

          new ButtonBuilder()
            .setLabel(`Delete`)
            .setCustomId(`delete`)
            .setStyle(ButtonStyle.Danger)
        );

        const embed = new EmbedBuilder()
          .setColor(client.config.embed)
          .setAuthor({
            name: `${usermention.tag}`,
            iconURL: `${usermention.displayAvatarURL({
              dynamic: true,
              size: 512,
            })}`,
          })
          .setTitle(`Download`)
          .setURL(
            usermention.displayAvatarURL({
              size: 1024,
              format: `png`,
              dynamic: true,
            })
          )
          .setImage(
            usermention.displayAvatarURL({
              size: 1024,
              format: "png",
              dynamic: true,
            })
          );

        const embed2 = new EmbedBuilder()
          .setColor(client.config.embed)
          .setAuthor({
            name: `${usermention.tag}`,
            iconURL: `${usermention.displayAvatarURL({
              dynamic: true,
              size: 512,
            })}`,
          })
          .setDescription(banner ? " " : "User does not have a banner")
          .setTitle(`Download`)
          .setURL(banner)
          .setImage(banner);

        const message = await interaction.reply({
          embeds: [embed],
          components: [cmp],
        });
        const collector = await message.createMessageComponentCollector();

        collector.on(`collect`, async (c) => {
          if (c.customId === "avatar") {
            if (c.user.id !== interaction.user.id) {
              return await c.reply({
                content: `Only ${interaction.user.tag} can interact with the buttons!`,
                flags: MessageFlags.Ephemeral,
              });
            }

            await c.update({ embeds: [embed], components: [cmp] });
          }

          if (c.customId === "banner") {
            if (c.user.id !== interaction.user.id) {
              return await c.reply({
                content: `Only ${interaction.user.tag} can interact with the buttons!`,
                flags: MessageFlags.Ephemeral,
              });
            }

            await c.update({ embeds: [embed2], components: [cmp2] });
          }

          if (c.customId === "delete") {
            if (c.user.id !== interaction.user.id) {
              return await c.reply({
                content: `Only ${interaction.user.tag} can interact with the buttons!`,
                flags: MessageFlags.Ephemeral,
              });
            }

            interaction.deleteReply();
          }
        });
    }
  },
};

