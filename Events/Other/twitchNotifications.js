const { Events, EmbedBuilder } = require('discord.js');
const TwitchNotification = require('../../Schemas/twitchSchema');
const fetch = require('node-fetch');
const liveStatusMap = new Map();

async function isStreamerLive(streamer) {
  const clientId = 'fhstgm61oj9kqercl2ual1osz8w3yx';
  const clientSecret = '0qo9dutrrt8vdp5o2gny4uiq83ifd7';

  const tokenResponse = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, {
    method: 'POST',
  });

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${streamer}`, {
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();
  return data.data.length > 0;
}

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    setInterval(async () => {
      const configs = await TwitchNotification.find();
    
      for (const config of configs) {
        const streamerName = config.Streamer.split('/').pop();
        const isLive = await isStreamerLive(streamerName);
        const lastStatus = liveStatusMap.get(streamerName) || false;

        // Check if the streamer is live and if we haven't notified recently
        const now = new Date();
        const lastNotified = config.LastNotified ? new Date(config.LastNotified) : null;
        const notifyThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds

        if (isLive && !lastStatus && (!lastNotified || now - lastNotified > notifyThreshold)) {
          const channel = await client.channels.fetch(config.Channel);
          if (channel) {
            const customMessage = config.Message;
            await channel.send({ content: `${customMessage} \n>>> [**${streamerName} is live here**](${config.Streamer})` });

            // Update LastNotified field
            config.LastNotified = now;
            await config.save();
          }
        }
    
        liveStatusMap.set(streamerName, isLive);
      }
    }, 60000);
  },
};