const config = {
  // Color for embedded bot messages
  embed: "#ff434e",
  // Command prefix for bot commands
  prefix: "-",
  // Channel ID for logging errors (Development Server)
  logchannel: "",
  // Channel ID for reporting bugs (Development Server)
  bugreport: "",
  // Channel ID for user feedback (Development Server)
  feedback: "",
  // Channel ID for receiving bot suggestions (Development Server)
  botsuggestions: "",
  // Your Discord User ID for development purposes
  developerid: "",
  // Your Discord Bot ID for API interactions
  clientID: "",
  // API key for image generation (Obtain from https://discord.gg/QprAy5WWWQ)
  imagegenapi: "",
  // API key for Gemini services (Obtain from https://ai.google.dev/)
  gemini_api: "",

  // Spotify API credentials
  // Obtain your Spotify Client ID and Client Secret from the Spotify Developer Portal: 
  // https://developer.spotify.com/dashboard/
  SpotifyClientID: "",
  SpotifyClientSecret: "",

  // Lavalink server configuration
  lavalink: {
    name: `Razor Node`,
    url: `lavalink.razorbot.buzz:6969`,
    auth: "dsc.gg/razorsupport",
    secure: false,
  },
};

module.exports = config;