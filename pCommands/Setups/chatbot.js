const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const aiConfig = require("../../Schemas/aiSchema");

module.exports = {
    name: "ai-config",
    aliases: ["chatbot", 'aiconfig', 'chat bot'],
    description: "Configure Artificial Intelligence in your server!",
    args: true,
    usage: "<subcommand> [options]",

    async execute(message, client, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({
                content: `<:error:1238390205707325500> | You don't have permissions to manage the AI configuration.`,
                flags: MessageFlags.Ephemeral,
            });
        }

        const subcommand = args[0];
        let data = await aiConfig.findOne({ guildId: message.guild.id });
        const embed = new EmbedBuilder()
            .setAuthor({ name: `AI Config`, iconURL: client.user.displayAvatarURL() })
            .setColor(client.config.embed)
            .setTimestamp();

        switch (subcommand) {
            case "configure":
                const channel = message.mentions.channels.first();
                if (!channel) {
                    return message.reply("Please mention a channel to bind the AI.");
                }

                if (!data) {
                    await aiConfig.create({
                        guildId: message.guild.id,
                        channelId: channel.id,
                    });

                    embed
                        .setColor(client.config.embed)
                        .setAuthor({ name: `🤖 AI-Chat System` })
                        .setFooter({ text: `🤖 AI-Chat Added` })
                        .addFields({
                            name: `• Channel Added`,
                            value: `> Artificial Intelligence has been bound to ${channel}`,
                        })
                        .setTitle("> Channel Added")
                        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }));
                } else {
                    await aiConfig.findOneAndUpdate(
                        { guildId: message.guild.id },
                        { channelId: channel.id }
                    );

                    embed
                        .setColor(client.config.embed)
                        .setAuthor({ name: `🤖 AI-Chat System` })
                        .setFooter({ text: `🤖 AI-Chat Updated` })
                        .addFields({
                            name: `• Channel Updated`,
                            value: `> Artificial Intelligence has been changed to ${channel}`,
                        })
                        .setTitle("> Channel Updated")
                        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }));
                }
                break;

            case "blacklist":
                const userId = args[1];
                const action = args[2];

                if (!data) {
                    return message.reply("You need to configure artificial intelligence before adding or removing blacklists.");
                }

                if (action === "add") {
                    if (data.blacklists.includes(userId)) {
                        return message.reply("This user is already blacklisted...");
                    } else {
                        data.blacklists.push(userId);
                        embed.setDescription(
                            `<@${userId}> has been blacklisted from using Artificial Intelligence in this server.\nUse \`!ai-config blacklist remove <user>\` to undo this action.`
                        );
                    }
                } else if (action === "remove") {
                    data.blacklists = data.blacklists.filter((id) => id !== userId);
                    embed.setDescription(
                        `<@${userId}> has been removed from the blacklist. They can now use AI again.`
                    );
                }
                await data.save();
                break;

            case "disable":
                if (!data) {
                    return message.reply("You need to configure artificial intelligence before disabling it.");
                }

                await aiConfig.findOneAndDelete({ guildId: message.guild.id });
                embed.setDescription("Artificial Intelligence has been disabled in this server.");
                break;

            case "view":
                    if (!data) {
                        return message.reply("You need to configure artificial intelligence before viewing the configuration.");
                    }
                
                    const channelId = data.channelId; // Keep this as is
                    const aiChannel = message.guild.channels.cache.get(channelId); // Rename to aiChannel
                    const blacklistedUsers = data.blacklists.map(id => `<@${id}>`).join(", ") || "None";
                
                    embed.setDescription(
                        `Current AI Configuration:\n\n> Channel: ${aiChannel}\n> Blacklisted users: ${blacklistedUsers}`
                    );
                    break;

            default:
                return message.reply("Invalid subcommand. Please use `configure`, `blacklist`, `disable`, or `view`.");
        }

        await message.reply({ embeds: [embed] });
    },
};

