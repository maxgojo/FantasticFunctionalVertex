
// -------------------------------
// Environment Configuration
// -------------------------------
require("dotenv").config();

// -------------------------------
// Discord.js Imports
// -------------------------------
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  EmbedBuilder,
  Events,
} = require("discord.js");

// -------------------------------
// External Modules
// -------------------------------
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const dayjs = require("dayjs");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const { Kazagumo, Plugins } = require("kazagumo");
const { Connectors } = require("shoukaku");
const Spotify = require("kazagumo-spotify");
const KazagumoFilter = require("kazagumo-filter");

// -------------------------------
// Internal Modules and Handlers
// -------------------------------
const config = require("./config");
const GiveawaysManager = require("./Handlers/giveaway");
const { logError, setupErrorListeners } = require("./Handlers/errorHandler");
const { handleLogs } = require("./Events/Other/handleLogs");
const { loadEvents } = require("./Handlers/eventHandler");
const { loadCommands } = require("./Handlers/commandHandler");
const { prefixCommands } = require("./Handlers/prefixHandler");
const { loadModals } = require("./Handlers/modalHandler");
const { loadButtons } = require("./Handlers/buttonHandler");

// -------------------------------
// Client Initialization
// -------------------------------
const client = new Client({
  intents: Object.values(GatewayIntentBits),
  partials: Object.values(Partials),
});

client.config = config;
client.cooldowns = new Collection();
client.pcommands = new Collection();
client.aliases = new Collection();
client.commands = new Collection();
client.events = new Collection();
client.modals = new Collection();
client.buttons = new Collection();
client.setMaxListeners(25);

// -------------------------------
// Lavalink (Music System) Setup
// -------------------------------
const Nodes = [
  {
    name: config.lavalink.name,
    url: config.lavalink.url,
    auth: config.lavalink.auth,
    secure: config.lavalink.secure,
  },
];

client.manager = new Kazagumo(
  {
    defaultSearchEngine: "spotify",
    plugins: [
      new Plugins.PlayerMoved(client),
      new KazagumoFilter(),
      new Spotify({
        clientId: client.config.SpotifyClientID,
        clientSecret: client.config.SpotifyClientSecret,
        playlistPageLimit: 1,
        albumPageLimit: 1,
        searchLimit: 10,
        searchMarket: "IN",
      }),
    ],
    send: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      if (guild) guild.shard.send(payload);
    },
  },
  new Connectors.DiscordJS(client),
  Nodes
);

client.manager.shoukaku.on("ready", (name) =>
  console.log(
    `${dayjs().format("DD/MM/YYYY HH:mm:ss")} - ${chalk.blueBright(
      "Razor"
    )} => ${chalk.yellowBright("Lavalink")} - Lavalink ${name}: Ready!`
  )
);

client.manager.shoukaku.on("error", (name, error) =>
  console.error(`Lavalink ${name}: Error Caught,`, error)
);

client.manager.shoukaku.on("close", (name, code, reason) =>
  console.warn(
    `Lavalink ${name}: Closed, Code ${code}, Reason ${reason || "No reason"}`
  )
);

// -------------------------------
// System Loaders
// -------------------------------
const systemsPath = path.join(__dirname, "Systems");
const systemFiles = fs
  .readdirSync(systemsPath)
  .filter((file) => file.endsWith(".js"));

let loadedSystemsCount = 0;

for (const file of systemFiles) {
  const system = require(path.join(systemsPath, file));
  system(client);
  loadedSystemsCount++;
}

console.log(
  `${dayjs().format("DD/MM/YYYY HH:mm:ss")} - ${chalk.blueBright(
    "Razor"
  )} => ${chalk.blueBright("System")} - Loaded Systems: ${loadedSystemsCount}`
);

// -------------------------------
// Giveaway Manager
// -------------------------------
client.giveawayManager = new GiveawaysManager(client, {
  default: {
    botsCanWin: false,
    embedColor: client.config.embed,
    embedColorEnd: client.config.embed,
    reaction: "🎉",
  },
});

// -------------------------------
// Error Handling
// -------------------------------
setupErrorListeners(client);

// -------------------------------
// Event, Modal, and Button Loaders
// -------------------------------
loadEvents(client);
prefixCommands(client);
loadModals(client);
loadButtons(client);
handleLogs(client);

// -------------------------------
// Bot Login
// -------------------------------
client
  .login(process.env.token)
  .then(() => {
    loadCommands(client);
    console.log(
      `${dayjs().format("DD/MM/YYYY HH:mm:ss")} - ${chalk.blueBright(
        "Razor"
      )} => ${chalk.greenBright("Bot")} - Logged in successfully!`
    );
  })
  .catch((err) => console.error(err));



// -------------------------------
// Music Events System
// -------------------------------
client.manager.on("playerStart", async (player, track) => {
  try {
    const playerStartEvent = require("./Events/Lavalink/playerStart.js");
    await playerStartEvent.execute(client, player, track);
  } catch (error) {
    console.error(`Error executing playerStart Event: ${error}`);
  }
});

client.manager.on("playerEmpty", async (player) => {
  try {
    const playerEmptyEvent = require("./Events/Lavalink/playerEmpty.js");
    await playerEmptyEvent.execute(client, player);
  } catch (error) {
    console.error(`Error executing playerEmpty Event: ${error}`);
  }
});

client.manager.on("playerEnd", async (player) => {
  try {
    const playerEndEvent = require("./Events/Lavalink/playerEnd.js");
    await playerEndEvent.execute(client, player);
  } catch (error) {
    console.error(`Error executing playerEnd Event: ${error}`);
  }
});

// -------------------------------
// Mention Reply System
// -------------------------------
client.on(Events.MessageCreate, async (message) => {
  if (message.content !== `<@${client.config.clientID}>`) return;

  const helpCommand = await client.application.commands.fetch();
  const helpCommandId = helpCommand.find((cmd) => cmd.name === "help")?.id;

  const embed = new EmbedBuilder()
    .setColor(client.config.embed)
    .setTitle(`👋 Hello, I'm ${client.user.username}!`)
    .setDescription("Your friendly neighborhood bot, here to assist you! 🤖")
    .addFields(
      { name: "✨ Prefix", value: "`/`", inline: true },
      {
        name: "📚 Help",
        value: helpCommandId ? `</help:${helpCommandId}>` : "Help command not found.",
        inline: true,
      },
      {
        name: "🔗 Invite Me",
        value: `[Click here to invite Razor to your server!](https://discord.com/api/oauth2/authorize?client_id=${client.config.clientID}&permissions=8&scope=bot%20applications.commands)`,
      }
    )
    .setFooter({ text: "Thanks for using Razor! We're always here to help." })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
});

// -------------------------------
// Command Usage Logger
// -------------------------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction || !interaction.isChatInputCommand()) return;

  const channel = await client.channels.cache.get(client.config.logchannel);
  const server = interaction.guild.name;
  const user = interaction.user.tag;
  const userId = interaction.user.id;

  const embed = new EmbedBuilder()
    .setColor("Random")
    .setTitle(`⚠️ Chat Command Used!`)
    .addFields({ name: `Server Name`, value: `${server}` })
    .addFields({ name: `Chat Command`, value: `${interaction}` })
    .addFields({ name: `User`, value: `${user} / ${userId}` })
    .setTimestamp()
    .setFooter({ text: `Chat Command Executed` });

  await channel.send({ embeds: [embed] });
});

// -------------------------------
// Snipe Command System
// -------------------------------
client.on("messageDelete", (message) => {
  require("./Commands/Moderation/snipe.js").onMessageDelete(message);
});

// -------------------------------
// Export Client
// -------------------------------
module.exports = client;

