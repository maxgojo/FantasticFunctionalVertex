const { Events, EmbedBuilder } = require('discord.js');
const phoneschema = require("../Schemas/phoneschema");

module.exports = (client) => {
    client.on(Events.MessageCreate, async (message) => {
        if (message.guild === null) return;

        const phonedata = await phoneschema.findOne({ Guild: message.guild.id });
        if (!phonedata) return;

        const phonechannel = client.channels.cache.get(phonedata.Channel);

        if (message.author.id === client.config.clientID) return;
        if (phonechannel.id !== message.channel.id) return;

        try {
            message.react("📧");
        } catch (err) {
            throw err;
        }

        const multidata = await phoneschema.find({ Setup: "defined" });

        await Promise.all(
            multidata.map(async (data) => {
                const phonechannels = await client.channels.fetch(data.Channel);
                let phonemessage = message.content || "**No message provided!**";
                const filtermessage = phonemessage.toLowerCase();

                if (message.channel.id === phonechannels.id) return;

                const phoneembed = new EmbedBuilder()
                    .setColor(client.config.embed)
                    .setFooter({
                        text: `📞 Message Received from: ${message.guild.name.slice(0, 180)}`,
                    })
                    .setAuthor({ name: `📞 Phone System` })
                    .setTimestamp()
                    .setTitle(`> ${message.author.tag.slice(0, 256)}`)
                    .setDescription(`${phonemessage.slice(0, 4000)}`);

                phonechannels
                    .send({ embeds: [phoneembed] })
                    .catch((err) =>
                        console.log("Error received trying to send a phone message!")
                    );

                return phonechannels;
            })
        );
    });
};


