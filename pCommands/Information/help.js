const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
  } = require("discord.js");
  const fs = require("fs");
  
  module.exports = {
    name: "help",
    description: "Get information about the Razor Bot Commands.",
  
    async execute(message, client, args) {
      let servers = await client.guilds.cache.size;
      let users = await client.guilds.cache.reduce(
        (a, b) => a + b.memberCount,
        0
      );
  
      const commandFolders = fs
      .readdirSync(`./pCommands`) // Ensure this points to the correct folder
      .filter(folder => !folder.startsWith("."));

    const commandsByCategory = {};
    for (const folder of commandFolders) {
      const commandFiles = fs
        .readdirSync(`./pCommands/${folder}`)
        .filter(file => file.endsWith(".js"));
      const commands = [];

      for (const file of commandFiles) {
        try {
          const { default: command } = await import(`./../${folder}/${file}`); // Adjust path as necessary
          commands.push({
            name: command.name,
            description: command.description,
          });
        } catch (error) {
          console.error(`Failed to load command ${file} from ${folder}:`, error);
        }
      }

      commandsByCategory[folder] = commands;
    }
  
      const dropdownOptions = [
        {
          label: 'Home',
          value: 'home',
          emoji: '<:home:1271444957454008350>',
        },
        ...Object.keys(commandsByCategory).map((folder) => ({
          label: folder,
          value: folder,
          emoji: {
            Information: `<:info:1271441965656834048>`,
            Music: `<:music:1271441981004058687>`,
          }[folder],
        })),
      ];
  
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`category-select`)
        .setPlaceholder("Razor | Help Menu")
        .addOptions(...dropdownOptions);
  
      const embed = new EmbedBuilder()
        .setAuthor({
          name: "Razor",
          iconURL: client.user.avatarURL(),
          url: "https://discord.com/api/oauth2/authorize?client_id=1002188910560026634&permissions=8&scope=bot%20applications.commands",
        })
        .setDescription(
          `• Hey! :wave:
    • Total commands: ${client.commands.size}
    • Get [\`Razor\`](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=303600576574&scope=bot%20applications.commands) | [\`Support server\`](https://discord.gg/5FzKutmwSw) | [\`Vote Me\`](https://top.gg/bot/1002188910560026634/vote)
    • In \`${servers}\` servers with \`${users}\` members`
        )
        .setImage(
          `https://media.discordapp.net/attachments/1077409692302721154/1089068340141641739/wallpaperflare.com_wallpaper.png?width=960&height=313`
        )
        .addFields({
          name: `__**Main**__`,
          value: `<:thunderr:1271447633789063262> Automod\n<:admin:1271441934560526456> Setup\n<:modd:1271447618857205800> Moderation\n<:earlyuser:1271441951639474186> Fun\n<:gw:1271441963249434707> Giveaways\n<:info:1271441965656834048> Information\n<:music:1271441981004058687> Music`,
          inline: true,
        })
        .addFields({
          name: `**__Extras__**`,
          value: `<:eco:1271444950676013189> Economy & Ranking\n<:files:1271441956936876053> Images\n<:utils:1271442002285690891> Utilities\n<:ban:1271441940097011762> Tools`,
          inline: true,
        })
        .setThumbnail(client.user.avatarURL({ size: 512 }))
        .setFooter({
          text: `Made with 💖 by @arpandevv`,
          iconURL: client.user.avatarURL(),
        })
        .setColor(client.config.embed);
  
      const supportButton = new ButtonBuilder()
        .setLabel('Support Server')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/5FzKutmwSw');
  
      const inviteButton = new ButtonBuilder()
        .setLabel('Invite Bot')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=303600576574&scope=bot%20applications.commands`);
  
      const voteButton = new ButtonBuilder()
        .setLabel('Vote Bot')
        .setStyle(ButtonStyle.Link)
        .setURL('https://top.gg/bot/1002188910560026634/vote');
  
      const buttonRow = new ActionRowBuilder().addComponents(supportButton, inviteButton, voteButton);
      const row = new ActionRowBuilder().addComponents(selectMenu);
  
      await message.reply({ embeds: [embed], components: [row, buttonRow] });
  
      const filter = (i) => i.isStringSelectMenu() && i.customId === "category-select";
      const collector = message.channel.createMessageComponentCollector({
        filter,
        time: 600000, // 10 minutes in milliseconds
      });
  
      collector.on("collect", async (i) => {
        if (i.user.id !== message.author.id) {
          await i.reply({ content: "This menu can only be operated by the command invoker.", ephemeral: true });
          return;
        }
  
        if (i.values[0] === "home") {
          await i.update({ embeds: [embed] });
        } else {
          const selectedCategory = i.values[0];
          const categoryCommands = commandsByCategory[selectedCategory];
  
          const categoryEmbed = new EmbedBuilder()
            .setColor(client.config.embed)
            .setAuthor({
              name: `${selectedCategory} Commands`,
              iconURL: client.user.avatarURL(),
              url: "https://discord.com/api/oauth2/authorize?client_id=1002188910560026634&permissions=8&scope=bot%20applications.commands",
            })
            .setDescription(
              `• ${categoryCommands
                .map((command) => `\`${command.name}\``)
                .join(", ")}`
            )
            .setFooter({
              text: `Made with 💖 by @arpandevv`,
              iconURL: client.user.avatarURL(),
            })
            .setThumbnail(client.user.displayAvatarURL());
  
          await i.update({ embeds: [categoryEmbed] });
        }
      });
  
      collector.on("end", async () => {
        await message.editReply({ components: [] }); // Disable the dropdown after 10 minutes
      });
    },
  };
  
