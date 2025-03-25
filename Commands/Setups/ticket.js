const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  PermissionFlagsBits, 
  ChannelType 
} = require('discord.js');
const TicketSetup = require('../../Schemas/TicketSetup');
const config = require('../../ticketconfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Manage the ticket system')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('Setup the ticket system')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('disable')
        .setDescription('Disable the ticket system')
    ),

  async execute(interaction, client) {
    if (interaction.options.getSubcommand() === 'setup') {
      const { guild } = interaction;

      // Initial embed asking for the ticket channel
      const embed = new EmbedBuilder()
        .setTitle('Ticket Setup')
        .setDescription('Please mention the channel where the ticket panel should be sent (e.g., #ticket-support or channel ID).')
        .setColor(client.config.embed);

      const msg = await interaction.reply({ embeds: [embed], fetchReply: true });

      // Create a message collector
      const filter = m => m.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

      collector.on('collect', async (message) => {
        const channel = message.mentions.channels.first() || guild.channels.cache.get(message.content);
        if (!channel || channel.type !== ChannelType.GuildText) {
          return message.reply('Please provide a valid text channel.');
        }

        // Delete the user's message
        await message.delete();

        // Now ask for the category
        const categoryEmbed = new EmbedBuilder()
          .setDescription('Please mention the category where the tickets should be created (e.g., #ticket-category or category ID).')
          .setColor(client.config.embed);
        await msg.edit({ embeds: [categoryEmbed] });

        const categoryCollector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

        categoryCollector.on('collect', async (categoryMessage) => {
          const category = categoryMessage.mentions.channels.first() || guild.channels.cache.get(categoryMessage.content);
          if (!category || category.type !== ChannelType.GuildCategory) {
            return categoryMessage.reply('Please provide a valid category.');
          }

          await categoryMessage.delete();

          // Ask for the transcripts channel
          const transcriptsEmbed = new EmbedBuilder()
            .setDescription('Please mention the channel where the transcripts should be sent (e.g., #transcripts or channel ID).')
            .setColor(client.config.embed);
          await msg.edit({ embeds: [transcriptsEmbed] });

          const transcriptsCollector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

          transcriptsCollector.on('collect', async (transcriptsMessage) => {
            const transcripts = transcriptsMessage.mentions.channels.first() || guild.channels.cache.get(transcriptsMessage.content);
            if (!transcripts || transcripts.type !== ChannelType.GuildText) {
              return transcriptsMessage.reply('Please provide a valid text channel for transcripts.');
            }

            await transcriptsMessage.delete();

            // Ask for the handlers role
            const handlersEmbed = new EmbedBuilder()
              .setDescription('Please mention the role that will handle the tickets (or type the role name or ID).')
              .setColor(client.config.embed);
            await msg.edit({ embeds: [handlersEmbed] });

            const handlersCollector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

            handlersCollector.on('collect', async (handlersMessage) => {
              const handlers = handlersMessage.mentions.roles.first() || 
                guild.roles.cache.find(role => role.name.toLowerCase() === handlersMessage.content.toLowerCase()) || 
                guild.roles.cache.get(handlersMessage.content);
              
              if (!handlers) {
                return handlersMessage.reply('Please mention a valid role for handlers, type the role name, or provide the role ID.');
              }

              await handlersMessage.delete();

              // Ask for the everyone role
              const everyoneEmbed = new EmbedBuilder()
                .setDescription('Please mention the @everyone role (type "everyone" for @everyone).')
                .setColor(client.config.embed);
              await msg.edit({ embeds: [everyoneEmbed] });

              const everyoneCollector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

              everyoneCollector.on('collect', async (everyoneMessage) => {
                const everyone = everyoneMessage.content.toLowerCase() === 'everyone' ? 'everyone' : 
                  everyoneMessage.mentions.roles.first() || 
                  guild.roles.cache.get(everyoneMessage.content);
                
                if (!everyone) {
                  return everyoneMessage.reply('Please mention a valid role for everyone or type "everyone".');
                }

                await everyoneMessage.delete();

                // Ask for the description
                const descriptionEmbed = new EmbedBuilder()
                  .setDescription('Please provide a description for the ticket embed.')
                  .setColor(client.config.embed);
                await msg.edit({ embeds: [descriptionEmbed] });

                const descriptionCollector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

                descriptionCollector.on('collect', async (descriptionMessage) => {
                  const description = descriptionMessage.content.replace(/\|/g, '\n');
                  await descriptionMessage.delete();

                  // Save the setup to the database
                  try {
                    await TicketSetup.findOneAndUpdate(
                      { GuildID: guild.id },
                      {
                        Channel: channel.id,
                        Category: category.id,
                        Transcripts: transcripts.id,
                        Handlers: handlers.id,
                        Everyone: everyone === 'everyone' ? '@everyone' : everyone.id,
                        Description: description,
                      },
                      {
                        new: true,
                        upsert: true,
                      }
                    );

                    const finalEmbed = new EmbedBuilder()
                      .setAuthor({
                        name: `${guild.name}'s Ticket Panel`,
                        iconURL: guild.iconURL({ dynamic: true, size: 1024 })
                      })
                      .setDescription(description)
                      .setColor(client.config.embed)
                      .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
                      .setFooter({
                        text: `Powered by ${client.user.username}`,
                        iconURL: client.user.displayAvatarURL({ dynamic: true, size: 1024 })
                      });

                    const dropdown = new StringSelectMenuBuilder()
                      .setCustomId('ticket-dropdown')
                      .setPlaceholder('Select a ticket type')
                      .addOptions([
                        {
                          label: 'Support',
                          description: 'Get support from our team.',
                          emoji: '📙',
                          value: 'support',
                        },
                        {
                          label: 'Report',
                          description: 'Report an issue or user.',
                          emoji: '🚨',
                          value: 'report',
                        },
                        {
                          label: 'Other',
                          description: 'Other inquiries.',
                          emoji: '🔷',
                          value: 'other',
                        },
                      ]);

                    await channel.send({
                      embeds: [finalEmbed],
                      components: [new ActionRowBuilder().addComponents(dropdown)],
                    });

                    return interaction.followUp({ 
                      embeds: [new EmbedBuilder().setDescription('The ticket panel was successfully created.').setColor('Green')], 
                      ephemeral: true 
                    });
                  } catch (err) {
                    console.log(err);
                    const errEmbed = new EmbedBuilder().setColor('Red').setDescription(config.ticketError);
                    return interaction.followUp({ embeds: [errEmbed], ephemeral: true });
                  }
                });
              });
            });
          });
        });
      });
    } else if (interaction.options.getSubcommand() === 'disable') {
      const { guild } = interaction;
      try {
        await TicketSetup.findOneAndDelete({ GuildID: guild.id });
        return interaction.reply({ 
          embeds: [new EmbedBuilder().setDescription('The ticket system has been disabled.').setColor('Red')], 
          ephemeral: true 
        });
      } catch (err) {
        console.log(err);
        const errEmbed = new EmbedBuilder().setColor('Red').setDescription(config.ticketError);
        return interaction.reply({ embeds: [errEmbed], ephemeral: true });
      }
    }
  },
};