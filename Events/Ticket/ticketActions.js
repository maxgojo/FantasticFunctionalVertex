const { EmbedBuilder, UserSelectMenuBuilder, PermissionFlagsBits, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { createTranscript } = require('discord-html-transcripts');
const TicketSetup = require('../../Schemas/TicketSetup');
const TicketSchema = require('../../Schemas/Ticket');
const config = require('../../ticketconfig');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        const { guild, member, customId, channel } = interaction;
        const { ManageChannels } = PermissionFlagsBits;

        // Defer the interaction to prevent duplicate ticket creation
        if (interaction.isStringSelectMenu() || interaction.isButton()) {
            await interaction.deferReply({ ephemeral: true });
        }

        // Handle dropdown menu interaction
        if (interaction.isStringSelectMenu() && customId === 'ticket-dropdown') {
            const docs = await TicketSetup.findOne({ GuildID: guild.id });
            if (!docs) return interaction.followUp({ embeds: [new EmbedBuilder().setDescription('Ticket system is not setup.').setColor('Red')], ephemeral: true });

            // Check if the user already has an open ticket
            const findTicket = await TicketSchema.findOne({ GuildID: guild.id, OwnerID: member.id });
            if (findTicket) {
                return interaction.followUp({ embeds: [new EmbedBuilder().setDescription('You already have an open ticket.').setColor('Red')], ephemeral: true });
            }

            // Generate a random ticket ID
            const ticketId = Math.floor(Math.random() * 9000) + 10000;

            try {
                // Create the ticket channel
                const ticketChannel = await guild.channels.create({
                    name: `${config.ticketName}-${ticketId}`,
                    type: ChannelType.GuildText,
                    parent: docs.Category,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone.id,
                            deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        },
                        {
                            id: docs.Handlers,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels],
                        },
                        {
                            id: member.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        },
                    ],
                });

                // Save the ticket to the database
                await TicketSchema.create({
                    GuildID: guild.id,
                    OwnerID: member.id,
                    MembersID: [member.id],
                    TicketID: ticketId,
                    ChannelID: ticketChannel.id,
                    Locked: false,
                    Claimed: false,
                });

                // Set the channel topic
                await ticketChannel.setTopic(`${config.ticketDescription} <@${member.id}>`).catch(error => { return; });

                // Create an embed for the ticket channel
                const embed = new EmbedBuilder()
                    .setTitle(config.ticketMessageTitle)
                    .setDescription(config.ticketMessageDescription)
                    .setColor(client.config.embed);

                // Create buttons for ticket management
                const buttons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket-close')
                        .setLabel(config.ticketClose)
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji(config.ticketCloseEmoji),
                    new ButtonBuilder()
                        .setCustomId('ticket-lock')
                        .setLabel(config.ticketLock)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji(config.ticketLockEmoji),
                    new ButtonBuilder()
                        .setCustomId('ticket-unlock')
                        .setLabel(config.ticketUnlock)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji(config.ticketUnlockEmoji),
                    new ButtonBuilder()
                        .setCustomId('ticket-manage')
                        .setLabel(config.ticketManage)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji(config.ticketManageEmoji),
                    new ButtonBuilder()
                        .setCustomId('ticket-claim')
                        .setLabel(config.ticketClaim)
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji(config.ticketClaimEmoji),
                );

                // Send the embed and buttons to the ticket channel
                await ticketChannel.send({ embeds: [embed], components: [buttons] }).catch(error => { return; });

                // Mention the handlers role and delete the mention message
                const handlersMention = await ticketChannel.send({ content: `<@&${docs.Handlers}>` });
                handlersMention.delete().catch(error => { return; });

                // Send a success message to the user
                const ticketMessage = new EmbedBuilder()
                    .setDescription(`${config.ticketCreate} <#${ticketChannel.id}>`)
                    .setColor('Green');

                await interaction.followUp({
                    embeds: [ticketMessage],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setURL(`https://discord.com/channels/${guild.id}/${ticketChannel.id}`)
                                .setLabel(config.ticketButtonCreated)
                                .setStyle(ButtonStyle.Link)
                                .setEmoji(config.ticketButtonCreatedEmoji),
                        ),
                    ],
                    ephemeral: true,
                });

                // Handle specific ticket types based on the dropdown selection
                switch (interaction.values[0]) {
                    case 'support':
                        await ticketChannel.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle('Support Ticket')
                                    .setDescription('A support ticket has been created. Please describe your issue in detail.')
                                    .setColor('Blue'),
                            ],
                        });
                        break;

                    case 'report':
                        await ticketChannel.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle('Report Ticket')
                                    .setDescription('A report ticket has been created. Please provide details about the issue or user you are reporting.')
                                    .setColor('Red'),
                            ],
                        });
                        break;

                    case 'other':
                        await ticketChannel.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle('Other Inquiry')
                                    .setDescription('An inquiry ticket has been created. Please describe your request or question.')
                                    .setColor('Yellow'),
                            ],
                        });
                        break;
                }
            } catch (err) {
                console.error(err);
                return interaction.followUp({ content: 'An error occurred while creating the ticket.', ephemeral: true });
            }
        }

        // Handle button interactions
        if (interaction.isButton()) {
            const docs = await TicketSetup.findOne({ GuildID: guild.id });
            if (!docs) return;

            const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(config.ticketError);
            if (!guild.members.me.permissions.has((r) => r.id === docs.Handlers)) {
                return interaction.followUp({ embeds: [errorEmbed], ephemeral: true }).catch(error => { return; });
            }

            const nopermissionsEmbed = new EmbedBuilder().setColor('Red').setDescription(config.ticketNoPermissions);
            const alreadyEmbed = new EmbedBuilder().setColor('Orange');
            const executeEmbed = new EmbedBuilder().setColor(client.config.embed);
            const data = await TicketSchema.findOne({ GuildID: guild.id, ChannelID: channel.id });
            if (!data) return;

            switch (customId) {
                case 'ticket-close':
                    if ((!member.permissions.has(ManageChannels)) & (!member.roles.cache.has(docs.Handlers))) {
                        return interaction.followUp({ embeds: [nopermissionsEmbed], ephemeral: true }).catch(error => { return; });
                    }

                    // Ask for a reason
                    await interaction.followUp({ content: 'Please provide a reason for closing this ticket:', ephemeral: true });

                    // Create a message collector to collect the user's response
                    const filter = response => response.author.id === member.id;
                    const collector = channel.createMessageCollector({ filter, max: 1, time: 30000 });

                    collector.on('collect', async (message) => {
                        const reason = message.content;

                        const transcript = await createTranscript(channel, {
                            limit: -1,
                            returnType: 'attachment',
                            saveImages: true,
                            poweredBy: false,
                            filename: config.ticketName + data.TicketID + '.html',
                        }).catch(error => { return; });

                        let claimed = data.Claimed === true ? '✅' : '❌';
                        data.ClaimedBy = data.ClaimedBy === undefined ? '❌' : `<@${data.ClaimedBy}>`;
                        const transcriptTimestamp = Math.round(Date.now() / 1000);

                        const transcriptEmbed = new EmbedBuilder()
                            .setDescription(`${config.ticketTranscriptMember} <@${data.OwnerID}>\n${config.ticketTranscriptTicket} ${data.TicketID}\n${config.ticketTranscriptClaimed} ${claimed}\n${config.ticketTranscriptModerator} ${data.ClaimedBy}\n${config.ticketTranscriptTime} <t:${transcriptTimestamp}:R> (<t:${transcriptTimestamp}:F>)`);

                        await guild.channels.cache.get(docs.Transcripts).send({
                            embeds: [transcriptEmbed],
                            files: [transcript],
                        }).catch(error => { return; });

                        const closingTicketEmbed = new EmbedBuilder()
                            .setTitle('Ticket Closed')
                            .setDescription(`This ticket was closed by <@${member.id}> for the following reason: ${reason}`)
                            .setColor('Red');

                        const row = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('reopen-ticket')
                                    .setLabel('Reopen')
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId('transcript-ticket')
                                    .setLabel('Transcript')
                                    .setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder()
                                    .setCustomId('delete-ticket')
                                    .setLabel('Delete')
                                    .setStyle(ButtonStyle.Danger)
                            );

                        await channel.send({ embeds: [closingTicketEmbed], components: [row] }).catch(error => { return; });

                        // Send the embed and the transcript to the ticket opener
                        const ticketOpenerEmbed = new EmbedBuilder()
                            .setTitle('Your Ticket Has Been Closed')
                            .setDescription(`Ticket Name: ${channel.name}\nClaimed By: ${data.ClaimedBy}\nClosed At: <t:${transcriptTimestamp}:F>\nClosed By: <@${member.id}>\nReason: ${reason}`)
                            .setColor('Red');

                        const ticketOwner = await guild.members.fetch(data.OwnerID);
                        await ticketOwner.send({ embeds: [ticketOpenerEmbed], files: [transcript] }).catch(error => { return; });

                        collector.stop();
                    });

                    collector.on('end', collected => {
                        if (collected.size === 0) {
                            interaction.followUp({ content: 'You did not provide a reason in time. The ticket will not be closed.', ephemeral: true }).catch(error => { return; });
                        }
                    });
                    break;

                case 'reopen-ticket':
                    const ticketData = await TicketSchema.findOne({ GuildID: guild.id, ChannelID: channel.id });
                    if (!ticketData) {
                        return interaction.followUp({ content: 'Ticket data not found.', ephemeral: true });
                    }

                    await channel.permissionOverwrites.edit(ticketData.OwnerID, {
                        [PermissionFlagsBits.ViewChannel]: true });

                    for (const memberId of ticketData.MembersID) {
                        await channel.permissionOverwrites.edit(memberId, {
                            [PermissionFlagsBits.ViewChannel]: true
                        });
                    }

                    await interaction.followUp({ content: 'The ticket has been reopened!', ephemeral: false });
                    break;

                case 'transcript-ticket':
                    const transcriptFile = await createTranscript(channel, {
                        limit: -1,
                        returnType: 'attachment',
                        saveImages: true,
                        poweredBy: false,
                        filename: `transcript-${channel.name}.html`,
                    });

                    await interaction.followUp({ content: 'Transcript generated!', files: [transcriptFile] });
                    break;

                case 'delete-ticket':
                    await interaction.followUp({ content: 'This channel will be deleted in 5 seconds.', ephemeral: false });
                    await TicketSchema.findOneAndDelete({ GuildID: guild.id, ChannelID: channel.id });
                    setTimeout(() => {
                        channel.delete().catch(error => { console.error('Failed to delete channel:', error); });
                    }, 5000);
                    break;

                case 'ticket-lock':
                    if ((!member.permissions.has(ManageChannels)) & (!member.roles.cache.has(docs.Handlers))) return interaction.followUp({ embeds: [nopermissionsEmbed], ephemeral: true }).catch(error => { return; });
                    alreadyEmbed.setDescription(config.ticketAlreadyLocked);
                    if (data.Locked == true) return interaction.followUp({ embeds: [alreadyEmbed], ephemeral: true }).catch(error => { return; });
                    await TicketSchema.updateOne({ ChannelID: channel.id }, { Locked: true });
                    executeEmbed.setDescription(config.ticketSuccessLocked);
                    data.MembersID.forEach((m) => { channel.permissionOverwrites.edit(m, { SendMessages: false }).catch(error => { return; }) });
                    channel.permissionOverwrites.edit(data.OwnerID, { SendMessages: false }).catch(error => { return; });
                    interaction.deferUpdate().catch(error => { return; });
                    interaction.channel.send({ embeds: [executeEmbed] }).catch(error => { return; });
                    break;

                case 'ticket-unlock':
                    if ((!member.permissions.has(ManageChannels)) & (!member.roles.cache.has(docs.Handlers))) return interaction.followUp({ embeds: [nopermissionsEmbed], ephemeral: true }).catch(error => { return; });
                    alreadyEmbed.setDescription(config.ticketAlreadyUnlocked);
                    if (data.Locked == false) return interaction.followUp({ embeds: [alreadyEmbed], ephemeral: true }).catch(error => { return; });
                    await TicketSchema.updateOne({ ChannelID: channel.id }, { Locked: false });
                    executeEmbed.setDescription(config.ticketSuccessUnlocked);
                    data.MembersID.forEach((m) => { channel.permissionOverwrites.edit(m, { SendMessages: true }).catch(error => { return; }) });
                    channel.permissionOverwrites.edit(data.OwnerID, { SendMessages: true }).catch(error => { return; });
                    interaction.deferUpdate().catch(error => { return; });
                    interaction.channel.send({ embeds: [executeEmbed] }).catch(error => { return; });
                    break;

                case 'ticket-manage':
                    if ((!member.permissions.has(ManageChannels)) & (!member.roles.cache.has(docs.Handlers))) return interaction.followUp({ embeds: [nopermissionsEmbed], ephemeral: true }).catch(error => { return; });
                    const menu = new UserSelectMenuBuilder()
                        .setCustomId('ticket-manage-menu')
                        .setPlaceholder(config.ticketManageMenuEmoji + config.ticketManageMenuTitle)
                        .setMinValues(1)
                        .setMaxValues(1);
                    interaction.followUp({ components: [new ActionRowBuilder().addComponents(menu)], ephemeral: true }).catch(error => { return; });
                    break;

                case 'ticket-claim':
                    if ((!member.permissions.has(ManageChannels)) & (!member.roles.cache.has(docs.Handlers))) return interaction.followUp({ embeds: [nopermissionsEmbed], ephemeral: true }).catch(error => { return; });
                    alreadyEmbed.setDescription(config.ticketAlreadyClaim + ' <@' + data.ClaimedBy + '>.');
                    if (data.Claimed == true) return interaction.followUp({ embeds: [alreadyEmbed], ephemeral: true }).catch(error => { return; });
                    await TicketSchema.updateOne({ ChannelID: channel.id }, { Claimed: true, ClaimedBy: member.id });
                    let lastinfos = channel;
                    await channel.edit({ name: config.ticketClaimEmoji + '・' + lastinfos.name, topic: lastinfos.topic + config.ticketDescriptionClaim + '<@' + member.id + '>.' }).catch(error => { return; });
                    executeEmbed.setDescription(config.ticketSuccessClaim + ' <@' + member.id + '>.');
                    interaction.deferUpdate().catch(error => { return; });
                    interaction.channel.send({ embeds: [executeEmbed] }).catch(error => { return; });
                    break;
            }
        }
    },
};