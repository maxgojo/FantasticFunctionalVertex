const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "loop",
    aliases: ["repeat"],
    description: "Toggle track/queue loop.",
    args: true,
    usage: "<track|queue|off>",

    async execute(message, client, args) {
        const mode = args[0]; // Get the first argument as the mode
        const player = client.manager.players.get(message.guild.id);

        if (!player) {
            return message.reply(":x: **There is no music currently playing!**");
        }

        const enable = ['enabled', 'activated'];
        const disable = ['disabled', 'deactivated'];

        let response;
        if (mode === 'track') {
            if (player.loop !== 'track') {
                player.setLoop('track');
                response = `Looping the current song **${enable[Math.floor(Math.random() * enable.length)]}**.`;
            } else {
                player.setLoop('none');
                response = `Looping the current song **${disable[Math.floor(Math.random() * disable.length)]}**.`;
            }
        } else if (mode === 'queue') {
            if (player.loop !== 'queue') {
                player.setLoop('queue');
                response = `Looping the queue **${enable[Math.floor(Math.random() * enable.length)]}**.`;
            } else {
                player.setLoop('none');
                response = `Looping the queue **${disable[Math.floor(Math.random() * disable.length)]}**.`;
            }
        } else if (mode === 'off') {
            player.setLoop('none');
            response = `Looping is now **${disable[Math.floor(Math.random() * disable.length)]}**.`;
        } else {
            return message.reply(":x: **Please provide a valid mode: track, queue, or off.**");
        }

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(client.config.embed)
                    .setDescription(response)
            ]
        });
    }
};

