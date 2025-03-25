const { Events, EmbedBuilder, ChannelType } = require('discord.js');
const joinschema = require("../Schemas/jointocreate");
const joinchannelschema = require("../Schemas/jointocreatechannels");

module.exports = (client) => {
    // Event: VoiceStateUpdate (Join to Create)
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
        if (!newState.guild) return;

        try {
            if (newState.member.guild === null) return;
        } catch (err) {
            return;
        }

        if (!newState.member.guild) return;
        if (newState.member.id === client.config.clientID) return;

        const joindata = await joinschema.findOne({ Guild: newState.member.guild.id });
        const joinchanneldata1 = await joinchannelschema.findOne({
            Guild: newState.member.guild.id,
            User: newState.member.id,
        });

        const voicechannel = newState.channel;

        if (!joindata) return;
        if (!voicechannel) return;

        if (voicechannel.id === joindata.Channel) {
            if (joinchanneldata1) {
                try {
                    const joinfail = new EmbedBuilder()
                        .setColor(client.config.embed)
                        .setTimestamp()
                        .setAuthor({ name: `🔊 Join to Create System` })
                        .setFooter({ text: `🔊 Issue Faced` })
                        .setTitle("> You tried creating a \n> voice channel but..")
                        .addFields({
                            name: `• Error Occurred`,
                            value: `> You already have a voice channel \n> open at the moment.`,
                        });

                    return await newState.member.send({ embeds: [joinfail] });
                } catch (err) {
                    return;
                }
            } else {
                try {
                    const channel = await newState.member.guild.channels.create({
                        type: ChannelType.GuildVoice,
                        name: `${newState.member.user.username}-room`,
                        userLimit: joindata.VoiceLimit,
                        parent: joindata.Category,
                    });

                    try {
                        await newState.member.voice.setChannel(channel.id);
                    } catch (err) {
                        console.log("Error moving member to the new channel!");
                    }

                    setTimeout(() => {
                        joinchannelschema.create({
                            Guild: newState.member.guild.id,
                            Channel: channel.id,
                            User: newState.member.id,
                        });
                    }, 500);
                } catch (err) {
                    console.log(err);

                    try {
                        const joinfail = new EmbedBuilder()
                            .setColor(client.config.embed)
                            .setTimestamp()
                            .setAuthor({ name: `🔊 Join to Create System` })
                            .setFooter({ text: `🔊 Issue Faced` })
                            .setTitle("> You tried creating a \n> voice channel but..")
                            .addFields({
                                name: `• Error Occurred`,
                                value: `> I could not create your channel, \n> perhaps I am missing some permissions.`,
                            });

                        await newState.member.send({ embeds: [joinfail] });
                    } catch (err) {
                        return;
                    }

                    return;
                }

                try {
                    const joinsuccess = new EmbedBuilder()
                        .setColor(client.config.embed)
                        .setTimestamp()
                        .setAuthor({ name: `🔊 Join to Create System` })
                        .setFooter({ text: `🔊 Channel Created` })
                        .setTitle("> Channel Created")
                        .addFields({
                            name: `• Channel Created`,
                            value: `> Your voice channel has been \n> created in **${newState.member.guild.name}**!`,
                        });

                    await newState.member.send({ embeds: [joinsuccess] });
                } catch (err) {
                    return;
                }
            }
        }
    });

    // Event: VoiceStateUpdate (Channel Deletion)
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
        try {
            if (oldState.member.guild === null) return;
        } catch (err) {
            return;
        }

        if (oldState.member.id === client.config.clientID) return;

        const leavechanneldata = await joinchannelschema.findOne({
            Guild: oldState.member.guild.id,
            User: oldState.member.id,
        });

        if (!leavechanneldata) return;

        const voicechannel = await oldState.member.guild.channels.cache.get(leavechanneldata.Channel);

        if (newState.channel === voicechannel) return;

        try {
            await voicechannel.delete();
        } catch (err) {
            return;
        }

        await joinchannelschema.deleteMany({
            Guild: oldState.guild.id,
            User: oldState.member.id,
        });

        try {
            const deletechannel = new EmbedBuilder()
                .setColor(client.config.embed)
                .setTimestamp()
                .setAuthor({ name: `🔊 Join to Create System` })
                .setFooter({ text: `🔊 Channel Deleted` })
                .setTitle("> Channel Deleted")
                .addFields({
                    name: `• Channel Deleted`,
                    value: `> Your voice channel has been \n> deleted in **${newState.member.guild.name}**!`,
                });

            await newState.member.send({ embeds: [deletechannel] });
        } catch (err) {
            return;
        }
    });
};

