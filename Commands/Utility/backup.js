const { SlashCommandBuilder, ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder } = require('discord.js');
const BackupSchema = require('../../Schemas/backupSchema');
const maxStates = 5;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Manage server backups')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Creates a backup of the server settings.')
                .addStringOption(option =>
                    option.setName('state').setDescription('The state to backup to (Default is latest).').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lists all backups of the server settings.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('restore')
                .setDescription('Restores a backup of the server settings from states.')
                .addStringOption(option =>
                    option.setName('state').setDescription('The state to restore from.').setRequired(false))
        ),
    async execute(interaction) {
        try {
            if (!interaction.guild) {
                return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
            }

            const subcommand = interaction.options.getSubcommand();
            const state = interaction.options.getString('state') || 'latest';

            if (subcommand === 'create') {
                await handleCreateBackup(interaction, state);
            } else if (subcommand === 'list') {
                await handleListBackups(interaction, state);
            } else if (subcommand === 'restore') {
                await handleRestoreBackup(interaction, state);
            }
        } catch (error) {
            console.error('Execute Error:', error);
            await interaction.followUp({ content: 'An error occurred while processing the command.', ephemeral: true });
        }
    },
};

async function handleCreateBackup(interaction, state) {
    try {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
            !interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild) &&
            interaction.member.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: 'You must have the `Administrator` or `Manage Server` permission to use this command.', ephemeral: true });
        }

        const existingBackup = await BackupSchema.findOne({ guildId: interaction.guild.id, state: state });
        const serverInfo = new EmbedBuilder()
            .setTitle('Server Backup')
            .setDescription(`Created Backup: ${state}\n\n\u200b<:dot:1272208757601992714> **Channels Stored:** ${interaction.guild.channels.cache.filter(channel => channel.type !== ChannelType.GuildCategory && channel.id !== interaction.guild.rulesChannelId && channel.id !== interaction.guild.publicUpdatesChannelId && channel.id !== interaction.guild.systemChannelId).size}\n<:dot:1272208757601992714> **Roles Stored:** ${interaction.guild.roles.cache.filter(role => !role.managed && role.name !== '@everyone' && !role.permissions.has(PermissionsBitField.Flags.Administrator)).size}\n<:dot:1272208757601992714> **Categories Stored:** ${interaction.guild.channels.cache.filter(channel => channel.type === ChannelType.GuildCategory).size}\n<:dot:1272208757601992714> **Forum Channels Stored:** ${interaction.guild.channels.cache.filter(channel => channel.type === ChannelType.GuildForum).size}\n<:dot:1272208757601992714>**Server Name: ** ${interaction.guild.name}\n<:s_curveup:1282720695091990698>**Server Owner:** <@${interaction.guild.ownerId}>\n<:s_curveup:1282720695091990698>**Server ID:** ${interaction.guild.id}\n\u200b`)
            .setColor('#80b918')
            .setTimestamp();

        const guildBackups = await BackupSchema.find({ guildId: interaction.guild.id });
        if (guildBackups.length >= maxStates) {
            const latestBackupIndex = guildBackups.findIndex(backup => backup.state === 'latest');
            const backupsToDelete = guildBackups.filter((backup, index) => index !== latestBackupIndex).slice(0, guildBackups.length - maxStates + 1);
            for (const backupToDelete of backupsToDelete) {
                await BackupSchema.findByIdAndDelete(backupToDelete._id);
            }
        }
        const serverDataString = await createBackupData(interaction);

        if (existingBackup) {
            await BackupSchema.updateOne({ guildId: interaction.guild.id, state: state }, { data: serverDataString });
            console.log('Updated backup');
        } else {
            await BackupSchema.create({ data: serverDataString, guildId: interaction.guild.id, state: state });
        }

        await interaction.reply({ content: 'Server backup created successfully!', embeds: [serverInfo], ephemeral: false });
    } catch (error) {
        console.error('Create Backup Error:', error);
        await interaction.reply({ content: 'An error occurred while creating the backup.', ephemeral: true });
    }
}

async function handleRestoreBackup(interaction, state) {
    try {
        const backup = await BackupSchema.findOne({ guildId: interaction.guild.id, state: state });
        if (!backup) {
            return interaction.reply({ content: 'No backup found.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const serverData = JSON.parse(backup.data);

            for (const channel of interaction.guild.channels.cache.filter(channel => channel.id !== interaction.guild.rulesChannelId && channel.id !== interaction.guild.publicUpdatesChannelId && channel.id !== interaction.guild.systemChannelId).values()) {
                await channel.delete();
            }

            for (const role of interaction.guild.roles.cache.filter(role => !role.managed && role.name !== '@everyone' && !role.permissions.has(PermissionsBitField.Flags.Administrator)).values()) {
                await role.delete();
            }

            for (const emoji of interaction.guild.emojis.cache.values()) {
                await emoji.delete();
            }


            for (const categoryData of serverData.categories) {
                await interaction.guild.channels.create({ name: categoryData.name, type: ChannelType.GuildCategory });
            }

            for (const channelData of serverData.channels) {
                const channelCategoryName = serverData.categories.find(category => category.channels && category.channels.includes(channelData.name))?.name;
                const channelCategory = interaction.guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === channelCategoryName);
                const permissions = channelData.permissions.map(permission => ({
                    id: interaction.guild.roles.cache.find(role => role.name === permission.id)?.id || interaction.guild.id,
                    allow: permission.allow,
                    deny: permission.deny,
                }));

                const channel = await interaction.guild.channels.create({
                    name: channelData.name,
                    type: channelData.type,
                    topic: channelData.description,
                    rateLimitPerUser: channelData.slowmode,
                    parent: channelCategory ? channelCategory.id : null,
                    permissionOverwrites: permissions,
                });

                if (channelData.type === ChannelType.GuildForum) {
                    const forumChannelData = serverData.forumChannels.find(forum => forum.name === channelData.name);
                    if (forumChannelData) {
                        await channel.setRateLimitPerUser(forumChannelData.settings.rateLimitPerUser);
                        await channel.setDefaultThreadRateLimitPerUser(forumChannelData.settings.defaultThreadRateLimitPerUser);
                        await channel.setDefaultAutoArchiveDuration(forumChannelData.settings.defaultAutoArchiveDuration);
                        await channel.setDefaultForumLayout(forumChannelData.settings.defaultForumLayout);
                        await channel.setAvailableTags(forumChannelData.settings.availableTags);
                    }
                }

                console.log(`Created channel: ${channelData.name}`);
            }

            const restoredRoles = {};
            for (const roleData of serverData.roles) {
                const role = await interaction.guild.roles.create({
                    name: roleData.name,
                    color: roleData.color,
                    permissions: roleData.permissions,
                    hoist: roleData.hoist,
                    mentionable: roleData.mentionable,
                    icon: roleData.icon,
                });
                await role.setPosition(roleData.position);
                restoredRoles[roleData.name] = role.id;
            }

            for (const memberData of serverData.members) {
                const member = await interaction.guild.members.fetch(memberData.id).catch(() => null);
                if (member) {
                    const memberRoles = memberData.roles.map(roleName => restoredRoles[roleName]).filter(Boolean);
                    if (memberRoles.length > 0) {
                        await member.roles.set(memberRoles);
                    }
                }
            }

            for (const emojiData of serverData.emojis) {
                await interaction.guild.emojis.create({ attachment: emojiData.url, name: emojiData.name });
                console.log(`Created emoji: ${emojiData.name}, ${emojiData.url}`);
            }

            await interaction.followUp({ content: 'Backup restored successfully!', ephemeral: true });
        } catch (error) {
            console.error('Restore Backup Error:', error);
            await interaction.followUp({ content: 'An error occurred while restoring the backup.', ephemeral: true });
        }
    } catch (error) {
        console.error('Find Backup Error:', error);
        await interaction.reply({ content: 'An error occurred while finding the backup.', ephemeral: true });
    }
}

async function handleListBackups(interaction, state) {
    try {
        const guildBackups = await BackupSchema.findOne({ guildId: interaction.guild.id, state: state });
        if (!guildBackups) {
            return interaction.reply({ content: 'No backups found.', ephemeral: true });
        }

        const backup = {
            state: guildBackups.state,
            date: guildBackups.createdAt ? guildBackups.createdAt.toLocaleString() : 'N/A',
            channelsStored: guildBackups.data ? JSON.parse(guildBackups.data).channels.length : 'N/A',
            rolesStored: guildBackups.data ? JSON.parse(guildBackups.data).roles.length : 'N/A',
            categoriesStored: guildBackups.data ? JSON.parse(guildBackups.data).categories.length : 'N/A',
            forumChannelsStored: guildBackups.data ? JSON.parse(guildBackups.data).forumChannels.length : 'N/A',
        }

        const embed = new EmbedBuilder()
            .setTitle('Server Backups')
            .setDescription(`Server backups for ${interaction.guild.name}`)
            .setColor('#80b918')
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .addFields(
                { name: 'State', value: `${backup.state || 'latest'}` },
                { name: 'Date', value: `**${backup.date}**`, inline: false },
                { name: 'Channels Stored', value: `**${backup.channelsStored}**`, inline: false },
                { name: 'Roles Stored', value: `**${backup.rolesStored}**`, inline: false },
                { name: 'Categories Stored', value: `**${backup.categoriesStored}**`, inline: false },
                { name: 'Forum Channels Stored', value: `**${backup.forumChannelsStored}**`, inline: false }
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }));

        await interaction.reply({ embeds: [embed], ephemeral: false });
    } catch (error) {
        console.error('List Backups Error:', error);
        await interaction.reply({ content: 'An error occurred while listing the backups.', ephemeral: true });
    }
}

async function createBackupData(interaction) {
    try {
        const serverData = {
            guildInfo: {
                name: interaction.guild.name,
                ownerID: interaction.guild.ownerId,
                icon: interaction.guild.iconURL({ dynamic: true }),
                banner: interaction.guild.bannerURL({ dynamic: true }),
                afkChannel: interaction.guild.afkChannel?.name,
                afkTimeout: interaction.guild.afkTimeout,
                systemChannel: interaction.guild.systemChannel?.name,
                rulesChannel: interaction.guild.rulesChannel?.name,
                systemChannelFlags: interaction.guild.systemChannelFlags.toArray(),
            },
            categories: interaction.guild.channels.cache.filter(channel => channel.type === ChannelType.GuildCategory).map(category => ({
                name: category.name,
                rawPos: category.rawPosition,
                channels: interaction.guild.channels.cache.filter(channel => channel.parentId === category.id).map(channel => channel.name)
            })),
            channels: interaction.guild.channels.cache.filter(channel => channel.type !== ChannelType.GuildCategory && channel.id !== interaction.guild.rulesChannelId && channel.id !== interaction.guild.publicUpdatesChannelId && channel.id !== interaction.guild.systemChannelId).map(channel => ({
                name: channel.name,
                type: channel.type,
                description: channel.topic,
                slowmode: channel.rateLimitPerUser,
                autoArchiveDuration: channel.defaultAutoArchiveDuration,
                rawPos: channel.rawPosition,
                permissions: channel.permissionOverwrites.cache
                    .filter(permission => permission.type === 0)
                    .map(permission => {
                        const roleName = interaction.guild.roles.cache.get(permission.id)?.name || '@everyone';
                        return {
                            id: roleName,
                            allow: permission.allow.toArray(),
                            deny: permission.deny.toArray()
                        };
                    }),
            })),
            forumChannels: interaction.guild.channels.cache.filter(channel => channel.type === ChannelType.GuildForum).map(forumChannel => ({
                name: forumChannel.name,
                settings: {
                    availableTags: forumChannel.availableTags,
                    defaultAutoArchiveDuration: forumChannel.defaultAutoArchiveDuration,
                    defaultForumLayout: forumChannel.defaultForumLayout,
                    defaultReactionEmoji: forumChannel.defaultReactionEmoji,
                    defaultSortOrder: forumChannel.defaultSortOrder,
                    defaultThreadRateLimitPerUser: forumChannel.defaultThreadRateLimitPerUser,
                    nsfw: forumChannel.nsfw,
                    rateLimitPerUser: forumChannel.rateLimitPerUser,
                    topic: forumChannel.topic,
                },
                permissions: forumChannel.permissionOverwrites.cache
                    .filter(permission => permission.type === 0)
                    .map(permission => {
                        const roleName = interaction.guild.roles.cache.get(permission.id)?.name || '@everyone';
                        return {
                            id: roleName,
                            allow: permission.allow.toArray(),
                            deny: permission.deny.toArray()
                        }
                    })
            })),
            roles: interaction.guild.roles.cache
                .filter(role => !role.managed && role.name !== '@everyone' && !role.permissions.has(PermissionsBitField.Flags.Administrator))
                .map(role => ({
                    id: role.id,
                    name: role.name,
                    permissions: role.permissions.toArray(),
                    color: role.color,
                    hoist: role.hoist,
                    mentionable: role.mentionable,
                    icon: role.iconURL({ dynamic: true }),
                    position: role.rawPosition
                })),
            members: interaction.guild.members.cache.map(member => ({
                id: member.id,
                roles: member.roles.cache.filter(role => role.name !== '@everyone' && !role.managed).map(role => role.name)
            })),
            emojis: interaction.guild.emojis.cache.map(emoji => ({
                name: emoji.name,
                url: emoji.url
            }))
        };

        return JSON.stringify(serverData);
    } catch (error) {
        console.error('Create Backup Data Error:', error);
        throw new Error('An error occurred while creating the backup data.');
    }
}

