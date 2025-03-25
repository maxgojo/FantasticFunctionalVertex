const { EmbedBuilder } = require('discord.js');
const chalk = require('chalk'); 

const sendErrorLog = async (client, title, description) => {
  const ChannelID = client.config.logchannel;
  const Channel = client.channels.cache.get(ChannelID);
  if (!Channel) return;

  const Embed = new EmbedBuilder()
    .setColor(client.config.embed)
    .setTimestamp()
    .setFooter({ text: "⚠️ Anti Crash system" })
    .setTitle(title)
    .setDescription(description);

  try {
    await Channel.send({ embeds: [Embed] });
  } catch (sendError) {
    console.error("Failed to send error log:", sendError);
  }
};

const logError = (client, errorType, error, origin) => {
  const errorMessage = `**${errorType}:\n\n** \`\`\`${error}\`\`\``;
  if (errorType === "Discord API Error") {
    console.log(chalk.red(`${errorType}:`), error, origin);
  } else {
    console.log(`${errorType}:`, error, origin);
  }
  sendErrorLog(client, errorType, errorMessage);
};

const setupErrorListeners = (client) => {
  client.on("error", (err) => {
    logError(client, "Discord API Error", err);
  });

  process.on("unhandledRejection", (reason, p) => {
    logError(client, "Unhandled Rejection", reason, p);
  });

  process.on("uncaughtException", (err, origin) => {
    logError(client, "Uncaught Exception", err, origin);
  });

  process.on("uncaughtExceptionMonitor", (err, origin) => {
    logError(client, "Uncaught Exception Monitor", err, origin);
  });

  process.on("warning", (warn) => {
    logError(client, "Warning", warn);
  });
};

module.exports = {
  logError,
  setupErrorListeners,
};