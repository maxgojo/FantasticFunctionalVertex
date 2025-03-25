const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
  } = require("discord.js");
  
  const TRACKS_PER_PAGE = 10; // Number of tracks to display per page
  
  module.exports = {
    name: "queue",
    aliases: ["q"],
    description: "View the music queue.",
  
    async execute(message, client, args) {
      try {
        const player = client.manager.players.get(message.guild.id);
  
        if (!player) {
          return message.reply({
            content: ":no_entry_sign: **There is no song playing right now!**",
          });
        }
  
        if (player.queue.size === 0) {
          return message.reply({
            content: ":no_entry_sign: **The queue is empty!**",
          });
        }
  
        const totalTracks = player.queue.size;
        const totalPages = Math.ceil(totalTracks / TRACKS_PER_PAGE);
        let currentPage = 0;
  
        const createEmbed = (page) => {
          const start = page * TRACKS_PER_PAGE;
          const end = Math.min(start + TRACKS_PER_PAGE, totalTracks);
          const queue = player.queue
            .slice(start, end)
            .map((track, index) => {
              return `**${start + index + 1}.** [${track.title}](${track.uri}) - **${track.author}**`;
            })
            .join("\n");
  
          return new EmbedBuilder()
            .setColor(client.config.embed)
            .setTitle("📃 Music Queue")
            .setDescription(queue || "No tracks in this page.")
            .setFooter({
              text: `Page ${page + 1} of ${totalPages} | Total tracks: ${totalTracks}`,
            });
        };
  
        const embed = createEmbed(currentPage);
  
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("Previous")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("Next")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages - 1)
        );
  
        const msg = await message.reply({
          embeds: [embed],
          components: [row],
        });
  
        const filter = (buttonInteraction) => {
          return buttonInteraction.user.id === message.author.id;
        };
  
        const collector = msg.createMessageComponentCollector({
          filter,
          time: 60000,
        });
  
        collector.on("collect", async (buttonInteraction) => {
          if (buttonInteraction.customId === "prev") {
            currentPage--;
          } else if (buttonInteraction.customId === "next") {
            currentPage++;
          }
  
          const newEmbed = createEmbed(currentPage);
          await buttonInteraction.update({
            embeds: [newEmbed],
            components: [row],
          });
  
          // Update button states
          row.components[0].setDisabled(currentPage === 0); // Previous button
          row.components[1].setDisabled(currentPage === totalPages - 1); // Next button
        });
  
        collector.on("end", () => {
          row.components.forEach((button) => button.setDisabled(true));
          msg.edit({ components: [row] });
        });
      } catch (error) {
        console.error(error);
        return message.reply(
          ":exclamation: **An error occurred while trying to view the queue.**"
        );
      }
    },
  };
  
