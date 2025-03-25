const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { convertTime } = require("../../Handlers/Music/convertTime");

module.exports = {
    name: "play",
    aliases: ["p"],
    args: true,
    usage: "<song>",
    description: "🎶 Play a song from any supported source.",

    async execute(message, client, args) {
        try {
            const search = args.join(" ");
            const { channel } = message.member.voice;

            if (!channel) {
                return message.reply(":no_entry_sign: **You need to be in a voice channel to play music!**");
            }

            if (!channel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.Connect)) {
                return message.reply(":lock: **I don't have permission to join your voice channel!**");
            }

            if (!channel.permissionsFor(message.guild.members.me).has(PermissionsBitField.Flags.Speak)) {
                return message.reply(":mute: **I don't have permission to play music in your voice channel!**");
            }

            message.reply({ content: `Searching... \`${search}\`` });

            const player = await client.manager.createPlayer({
                guildId: message.guild.id,
                textId: message.channel.id,
                voiceId: channel.id,
                volume: 100,
                deaf: true
            });
            const res = await player.search(search, { requester: message.author });

            if (!res.tracks.length) {
                return message.channel.send(":x: **No results found!**");
            }

            if (res.type === "PLAYLIST") {
                for (let track of res.tracks) {
                    player.queue.add(track);
                }
                if (!player.playing && !player.paused) {
                    player.play();
                }

                const embed = new EmbedBuilder()
                    .setColor(client.config.embed)
                    .setTitle(":notes: Playlist Added")
                    .setDescription(`**[${res.playlistName}](${search})** \n\n**Tracks Queued:** \`${res.tracks.length}\`\n**Total Duration:** \`${convertTime(res.tracks[0].length + player.queue.durationLength, true)}\``)
                    .setFooter({ text: "Enjoy your music! :headphones:" });

                return message.channel.send({ embeds: [embed] });
            } else {
                player.queue.add(res.tracks[0]);

                if (!player.playing && !player.paused) {
                    player.play();
                }

                return message.channel.send({ content: `>>> ***Track Added In Queue***:\n**[${res.tracks[0].title}](<${res.tracks[0].uri}>)**` });
            }
        } catch (error) {
            console.error(error);
            return message.reply(":exclamation: **An error occurred while trying to play the song.**");
        }
    }
};

