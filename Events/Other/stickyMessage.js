const { Events, EmbedBuilder } = require('discord.js');
const sticky = require('../../Schemas/stickySchema');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (!message.guild || !message.channel) return;

        var data = await sticky.find({ Guild: message.guild.id, Channel: message.channel.id });
        if (data.length === 0) return;
        if (message.author.bot) return;

        await Promise.all(data.map(async value => {
            if (value.Count === value.Cap - 1) {
                const embed = new EmbedBuilder()
                    .setColor(client.config.embed)
                    .setTitle(`${client.user.username} Sticky Message System`)
                    .setDescription(`> ${value.Message}`)
                    .setTimestamp();

                await message.channel.send({ embeds: [embed] });
                value.Count = 0;
                await value.save();
            } else {
                value.Count++;
                await value.save();
            }
        }));
    }
}